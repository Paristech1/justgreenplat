from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta, date
from typing import List, Optional
import random
import json
import uuid
from collections import defaultdict
from fastapi.responses import JSONResponse
from fastapi import BackgroundTasks
import smtplib
import os
from dotenv import load_dotenv
import pandas as pd
from prophet import Prophet

load_dotenv()

app = FastAPI(title="Microgreen Grower Portal API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# --- Models ---

class CropVariety(BaseModel):
    id: int
    name: str
    grow_cycle_days: int
    expected_yield_per_tray: float

class TrayPlanting(BaseModel):
    id: int
    variety_id: int
    plant_date: datetime
    expected_harvest_date: datetime
    status: str  # "planted", "growing", "harvested", "failed"
    tray_count: int = 1

class Harvest(BaseModel):
    id: int
    planting_id: int
    harvest_date: datetime
    actual_yield: float
    quality_score: int  # 1-10

# Inventory Module Models
class InventoryItem(BaseModel):
    id: str = str(uuid.uuid4())
    variety: str
    trayCount: int
    harvestDate: datetime
    weightKg: Optional[float] = None
    status: str # "in-storage", "sold", "waste"

class InventoryLog(BaseModel):
    id: str = str(uuid.uuid4())
    itemId: str
    change: int # +/- value
    reason: str
    timestamp: datetime = datetime.now()
    userId: str = "system" # Placeholder

# Order Module Models
class OrderItem(BaseModel):
    id: str = str(uuid.uuid4())
    orderId: str
    inventoryItemId: str # Link to the specific batch
    variety: str # Denormalized for convenience
    quantity: int # Number of trays
    price_per_tray: Optional[float] = None

class Order(BaseModel):
    id: str = str(uuid.uuid4())
    customerName: str
    customerContact: Optional[str] = None # e.g., email or phone
    orderDate: datetime = datetime.now()
    pickupDate: datetime
    status: str = "pending" # "pending", "confirmed", "completed", "cancelled"
    items: List[OrderItem] = []
    total_price: Optional[float] = None # Calculate based on items

# NEW: Forecasting Module Models
class SalesRecord(BaseModel): # For historical data if needed separately
    id: str = str(uuid.uuid4())
    date: date
    totalTraysSold: int
    revenue: Optional[float] = None

class ForecastPoint(BaseModel):
    date: date
    predictedTrays: float

class Forecast(BaseModel):
    id: str = str(uuid.uuid4())
    periodStart: date
    periodEnd: date
    predictions: List[ForecastPoint]
    createdAt: datetime = datetime.now()

# Notification Module Models
class NotificationCreate(BaseModel):
    message: str
    type: str  # e.g. "alert", "info"

class Notification(BaseModel):
    id: str = str(uuid.uuid4())
    message: str
    type: str  # "alert", "info"
    timestamp: datetime = datetime.now()
    is_read: bool = False

# In-memory storage for notifications
notifications: List[Notification] = []

# Helper to send notification emails
def send_email_notification(subject: str, body: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    email_from = os.getenv("EMAIL_FROM")
    email_to = os.getenv("EMAIL_TO")
    if not all([smtp_host, smtp_user, smtp_pass, email_from, email_to]):
        print("Email settings not configured. Skipping email notification.")
        return
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            message = f"Subject: {subject}\n\n{body}"
            server.sendmail(email_from, email_to, message)
    except Exception as e:
        print(f"Failed to send email: {e}")

@app.get("/notifications", response_model=List[Notification])
def get_notifications(unread: Optional[bool] = None):
    # Return all notifications or filter to only unread
    if unread:
        return [n for n in notifications if not n.is_read]
    return notifications

@app.post("/notifications", response_model=Notification, status_code=201)
def create_notification(notification_data: NotificationCreate, background_tasks: BackgroundTasks):
    # Create a new notification and enqueue email if it's an alert
    new_id = str(uuid.uuid4())
    now = datetime.now()
    new_notif = Notification(id=new_id, message=notification_data.message, type=notification_data.type, timestamp=now)
    notifications.append(new_notif)
    if notification_data.type == "alert":
        background_tasks.add_task(
            send_email_notification,
            f"Alert: {notification_data.message}",
            notification_data.message,
        )
    return new_notif

@app.put("/notifications/{notification_id}/read", response_model=Notification)
def mark_notification_read(notification_id: str):
    # Mark an existing notification as read
    for notif in notifications:
        if notif.id == notification_id:
            notif.is_read = True
            return notif
    raise HTTPException(status_code=404, detail="Notification not found")

# --- Mock Data ---

# Mock data for varieties
varieties = [
    {"id": 1, "name": "Sunflower", "grow_cycle_days": 10, "expected_yield_per_tray": 200.0},
    {"id": 2, "name": "Pea Shoots", "grow_cycle_days": 12, "expected_yield_per_tray": 175.0},
    {"id": 3, "name": "Radish", "grow_cycle_days": 8, "expected_yield_per_tray": 150.0},
    {"id": 4, "name": "Broccoli", "grow_cycle_days": 14, "expected_yield_per_tray": 180.0},
    {"id": 5, "name": "Arugula", "grow_cycle_days": 7, "expected_yield_per_tray": 125.0},
    {"id": 6, "name": "Kale", "grow_cycle_days": 10, "expected_yield_per_tray": 160.0},
    {"id": 7, "name": "Wheatgrass", "grow_cycle_days": 12, "expected_yield_per_tray": 210.0},
]

# Generate mock plantings
plantings = []
for i in range(1, 40):
    variety = random.choice(varieties)
    plant_date = datetime.now() - timedelta(days=random.randint(0, 60))
    expected_harvest_date = plant_date + timedelta(days=variety["grow_cycle_days"])
    status = random.choice(["planted", "growing", "growing", "harvested", "failed"])
    if status == "harvested" and expected_harvest_date > datetime.now(): status = "growing"
    if status == "growing" and expected_harvest_date < datetime.now(): status = "harvested"
    if status == "planted" and plant_date < datetime.now() - timedelta(days=3): status = "growing"
    
    plantings.append({
        "id": i,
        "variety_id": variety["id"],
        "plant_date": plant_date,
        "expected_harvest_date": expected_harvest_date,
        "status": status,
        "tray_count": random.randint(1, 5)
    })

# Generate mock harvests
harvests = []
for planting in plantings:
    if planting["status"] == "harvested":
        variety = next((v for v in varieties if v["id"] == planting["variety_id"]), None)
        if not variety: continue
        expected_yield = variety["expected_yield_per_tray"] * planting["tray_count"]
        actual_yield = expected_yield * random.uniform(0.75, 1.10)
        harvest_date = planting["expected_harvest_date"] + timedelta(hours=random.randint(-12, 12))
        
        harvests.append({
            "id": len(harvests) + 1,
            "planting_id": planting["id"],
            "harvest_date": harvest_date,
            "actual_yield": round(actual_yield, 2),
            "quality_score": random.randint(6, 10)
        })

# Generate mock inventory items based on harvests
inventory_items = []
inventory_logs = []
for harvest in harvests:
    planting = next((p for p in plantings if p["id"] == harvest["planting_id"]), None)
    if not planting: continue
    variety = next((v for v in varieties if v["id"] == planting["variety_id"]), None)
    if not variety: continue
    item_id = str(uuid.uuid4())
    
    item = {
        "id": item_id,
        "variety": variety["name"],
        "trayCount": planting["tray_count"],
        "harvestDate": harvest["harvest_date"],
        "weightKg": round(harvest["actual_yield"] / 1000, 2),
        "status": "in-storage"
    }
    inventory_items.append(item)
    
    log = {
        "id": str(uuid.uuid4()),
        "itemId": item_id,
        "change": item["trayCount"],
        "reason": "Initial harvest",
        "timestamp": item["harvestDate"],
        "userId": "system"
    }
    inventory_logs.append(log)

# Generate mock orders
orders = []
for i in range(1, 35):
    order_id = str(uuid.uuid4())
    order_date = datetime.now() - timedelta(days=random.randint(0, 60))
    pickup_date = order_date + timedelta(days=random.randint(2, 7))
    
    status = random.choice(["pending", "confirmed", "confirmed", "completed", "completed", "completed", "cancelled"])
    if status == "completed" and pickup_date > datetime.now(): status = "confirmed"
    if status == "confirmed" and order_date < datetime.now() - timedelta(days=10): status = random.choice(["completed", "cancelled"])
    
    order_items_list = []
    total_order_price = 0
    
    available_inventory = [item for item in inventory_items if item["status"] == "in-storage" and item["trayCount"] > 0 and item["harvestDate"] < order_date]
    random.shuffle(available_inventory)
    
    for _ in range(random.randint(1, 3)):
        if not available_inventory: break
        inventory_item_ref = next((item for item in inventory_items if item["id"] == available_inventory[0]["id"]), None)
        if not inventory_item_ref or inventory_item_ref["trayCount"] <= 0: 
            available_inventory.pop(0)
            continue # Skip if somehow ref lost or count is zero
            
        inventory_item = available_inventory.pop(0)
        quantity_to_order = random.randint(1, max(1, inventory_item["trayCount"])) 
        price_per = random.uniform(8.0, 12.0)
        
        order_item = OrderItem(
            id=str(uuid.uuid4()),
            orderId=order_id,
            inventoryItemId=inventory_item["id"],
            variety=inventory_item["variety"],
            quantity=quantity_to_order,
            price_per_tray=round(price_per, 2)
        )
        order_items_list.append(order_item.dict())
        total_order_price += order_item.quantity * (order_item.price_per_tray or 0)
        
        # Simulate inventory decrease IF order is not cancelled
        if status != "cancelled":
            try:
                # Find index again to modify the actual list item
                inv_idx_live = next((idx for idx, inv in enumerate(inventory_items) if inv["id"] == inventory_item["id"]), None)
                if inv_idx_live is not None:
                    inventory_items[inv_idx_live]["trayCount"] -= quantity_to_order
                    log = InventoryLog(itemId=inventory_item["id"], change=-quantity_to_order, reason=f"Order {order_id} ({status})")
                    inventory_logs.append(log.dict())
            except Exception as e:
                 print(f"Error adjusting inv for mock order {order_id}: {e}")
        
    if not order_items_list: continue

    order = Order(
        id=order_id,
        customerName=f"Customer {i}",
        customerContact=f"cust{i}@email.com",
        orderDate=order_date,
        pickupDate=pickup_date,
        status=status,
        items=[OrderItem(**item) for item in order_items_list],
        total_price=round(total_order_price, 2)
    )
    orders.append(order.dict())

# --- Helper Function for Inventory Adjustment ---

# Low stock threshold for alerts
try:
    low_stock_threshold = int(os.getenv("LOW_STOCK_THRESHOLD", 5))
except ValueError:
    low_stock_threshold = 5

def adjust_inventory(item_id: str, change: int, reason: str, user_id: str = "system"):
    index = next((i for i, item in enumerate(inventory_items) if item["id"] == item_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail=f"Inventory item {item_id} not found for adjustment")

    current_count = inventory_items[index]["trayCount"]
    new_count = current_count + change

    if new_count < 0:
        raise HTTPException(status_code=400, detail=f"Adjustment for item {item_id} results in negative inventory ({new_count}) for reason: {reason}")

    inventory_items[index]["trayCount"] = new_count
    
    log_entry = InventoryLog(
        itemId=item_id,
        change=change,
        reason=reason,
        userId=user_id,
        timestamp=datetime.now() # Log time of adjustment
    )
    inventory_logs.append(log_entry.dict())
    print(f"Inventory Adjusted: Item {item_id}, Change {change}, Reason: {reason}, New Count: {new_count}")
    
    # Low stock alert when inventory falls below threshold
    if change < 0 and new_count < low_stock_threshold:
        alert_msg = f"Low inventory: {inventory_items[index]['variety']} down to {new_count} trays"
        # In-app notification
        notif = Notification(id=str(uuid.uuid4()), message=alert_msg, type="alert", timestamp=datetime.now())
        notifications.append(notif)
        # Email alert
        send_email_notification(f"Inventory Alert: {inventory_items[index]['variety']}", alert_msg)

# --- API Routes ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the Microgreen Grower Portal API"}

@app.get("/varieties")
def get_varieties():
    return varieties

@app.get("/plantings")
def get_plantings():
    # Update status for ready plantings
    for p in plantings:
        if p["status"] == "growing" and p["expected_harvest_date"] <= datetime.now():
            p["status"] = "ready"
    return plantings

@app.get("/harvests")
def get_harvests():
    return harvests

# --- Inventory API Routes ---

@app.get("/inventory", response_model=List[InventoryItem])
def get_inventory_items(
    variety: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None
):
    filtered_items = inventory_items
    
    if variety:
        filtered_items = [item for item in filtered_items if item["variety"] == variety]
    if status:
        filtered_items = [item for item in filtered_items if item["status"] == status]
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            filtered_items = [item for item in filtered_items if item["harvestDate"] >= start_dt]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            filtered_items = [item for item in filtered_items if item["harvestDate"] <= end_dt]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
            
    return [InventoryItem(**item) for item in filtered_items]

@app.get("/inventory/{item_id}", response_model=InventoryItem)
def get_inventory_item(item_id: str):
    item = next((item for item in inventory_items if item["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return InventoryItem(**item)

@app.post("/inventory", response_model=InventoryItem, status_code=201)
def create_inventory_item(item_data: InventoryItem):
    if item_data.trayCount < 0:
        raise HTTPException(status_code=400, detail="Tray count cannot be negative")
    if item_data.status not in ["in-storage", "sold", "waste"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    item_dict = item_data.dict()
    item_dict["id"] = str(uuid.uuid4())
    item_dict["harvestDate"] = datetime.now() # Set harvest date on manual creation?
    inventory_items.append(item_dict)
    adjust_inventory(item_dict["id"], item_data.trayCount, "Manual creation")
    return InventoryItem(**item_dict)

@app.put("/inventory/{item_id}", response_model=InventoryItem)
def update_inventory_item(item_id: str, updated_item_data: InventoryItem):
    index = next((i for i, item in enumerate(inventory_items) if item["id"] == item_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    if updated_item_data.status not in ["in-storage", "sold", "waste"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    original_item = inventory_items[index]
    update_data = updated_item_data.dict(exclude_unset=True)
    
    if "trayCount" in update_data and update_data["trayCount"] != original_item["trayCount"]:
        raise HTTPException(status_code=400, detail="Tray count must be updated via logs")
        
    updated_item_dict = {**original_item, **update_data}
    inventory_items[index] = updated_item_dict
    return InventoryItem(**updated_item_dict)

@app.delete("/inventory/{item_id}", status_code=204)
def delete_inventory_item(item_id: str):
    global inventory_items
    index = next((i for i, item in enumerate(inventory_items) if item["id"] == item_id), None)
    if index is None:
         raise HTTPException(status_code=404, detail="Inventory item not found")
         
    # Log the removal as waste or adjustment to zero before deleting?
    adjust_inventory(item_id, -inventory_items[index]["trayCount"], "Item deleted")
    inventory_items.pop(index)
    return

@app.post("/inventory/{item_id}/log", response_model=InventoryLog, status_code=201)
def create_inventory_log(item_id: str, log_entry_data: InventoryLog):
    if log_entry_data.itemId != item_id:
         raise HTTPException(status_code=400, detail="Log entry itemId must match path item_id")
    
    # Use the helper function to handle adjustment and logging
    adjust_inventory(item_id, log_entry_data.change, log_entry_data.reason, log_entry_data.userId)
    
    created_log = next((log for log in reversed(inventory_logs) if log["itemId"] == item_id and log["reason"] == log_entry_data.reason), None)
    if not created_log:
         raise HTTPException(status_code=500, detail="Failed to retrieve created log entry")
         
    return InventoryLog(**created_log)
    
@app.get("/inventory/{item_id}/logs", response_model=List[InventoryLog])
def get_inventory_item_logs(item_id: str):
    if not any(item["id"] == item_id for item in inventory_items):
        raise HTTPException(status_code=404, detail="Inventory item not found")
        
    item_logs = [log for log in inventory_logs if log["itemId"] == item_id]
    return [InventoryLog(**log) for log in item_logs]


# --- Order API Routes ---

@app.get("/orders", response_model=List[Order])
def get_orders_list(
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    pickup_start_date: Optional[str] = None,
    pickup_end_date: Optional[str] = None
):
    filtered_orders = orders
    if status:
        filtered_orders = [o for o in filtered_orders if o["status"] == status]
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            filtered_orders = [o for o in filtered_orders if o["orderDate"] >= start_dt]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            filtered_orders = [o for o in filtered_orders if o["orderDate"] <= end_dt]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    # Apply pickup date filters
    if pickup_start_date:
        try:
            ps_dt = datetime.fromisoformat(pickup_start_date.replace('Z', '+00:00'))
            filtered_orders = [o for o in filtered_orders if o["pickupDate"] >= ps_dt]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid pickup_start_date format")
    if pickup_end_date:
        try:
            pe_dt = datetime.fromisoformat(pickup_end_date.replace('Z', '+00:00'))
            filtered_orders = [o for o in filtered_orders if o["pickupDate"] <= pe_dt]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid pickup_end_date format")
            
    result = []
    for order_dict in filtered_orders:
        order_copy = order_dict.copy()
        order_copy["items"] = [OrderItem(**item) for item in order_dict["items"]]
        result.append(Order(**order_copy))
    return result

@app.get("/orders/{order_id}", response_model=Order)
def get_order_details(order_id: str):
    order_dict = next((o for o in orders if o["id"] == order_id), None)
    if not order_dict:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order_copy = order_dict.copy()
    order_copy["items"] = [OrderItem(**item) for item in order_dict["items"]]
    return Order(**order_copy)

@app.post("/orders", response_model=Order, status_code=201)
def create_order(order_data: Order):
    order_dict = order_data.dict()
    order_dict["id"] = str(uuid.uuid4())
    order_dict["orderDate"] = datetime.now()
    
    total_price = 0
    processed_items = []
    inventory_adjustments = []
    
    for i, item_data in enumerate(order_data.items):
        item_dict = item_data.dict()
        item_dict["orderId"] = order_dict["id"]
        item_dict["id"] = str(uuid.uuid4())
        
        inv_index = next((idx for idx, inv in enumerate(inventory_items) if inv["id"] == item_data.inventoryItemId), None)
        if inv_index is None:
            raise HTTPException(status_code=404, detail=f"Inventory item {item_data.inventoryItemId} for order item {i+1} not found")
        
        inventory_item = inventory_items[inv_index]
        
        if inventory_item["variety"] != item_data.variety:
            raise HTTPException(status_code=400, detail=f"Variety mismatch for inventory item {item_data.inventoryItemId}")
            
        try:
            adjust_inventory(item_data.inventoryItemId, -item_data.quantity, f"Order {order_dict['id']}")
            inventory_adjustments.append((item_data.inventoryItemId, item_data.quantity))
        except HTTPException as e:
            for adj_item_id, adj_qty in inventory_adjustments:
                try: adjust_inventory(adj_item_id, adj_qty, f"Reverted failed order {order_dict['id']}")
                except Exception as revert_e: print(f"Error reverting inventory: {revert_e}")
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {item_data.variety} (Item ID: {item_data.inventoryItemId}): {e.detail}")
        
        item_price = item_data.quantity * (item_data.price_per_tray or 10.0)
        total_price += item_price
        item_dict["price_per_tray"] = item_data.price_per_tray or 10.0
        processed_items.append(item_dict)
        
    order_dict["items"] = processed_items
    order_dict["total_price"] = round(total_price, 2)
    order_dict["status"] = "pending"

    orders.append(order_dict)
    
    order_copy = order_dict.copy()
    order_copy["items"] = [OrderItem(**item) for item in order_dict["items"]]
    return Order(**order_copy)

from fastapi import Body

# Pydantic model for status update
class StatusUpdate(BaseModel):
    status: str

@app.put("/orders/{order_id}", response_model=Order)
def update_order_status(order_id: str, status_update: StatusUpdate):
    status_val = status_update.status
    valid_statuses = ["pending", "confirmed", "completed", "cancelled"]
    if status_val not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
    index = next((i for i, o in enumerate(orders) if o["id"] == order_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Order not found")
        
    original_status = orders[index]["status"]
    
    if status_val == "cancelled" and original_status != "cancelled":
        order_items_list = orders[index]["items"]
        for item_dict in order_items_list:
            try:
                adjust_inventory(item_dict["inventoryItemId"], item_dict["quantity"], f"Order {order_id} cancelled")
            except HTTPException as e:
                print(f"Error adjusting inventory on cancellation for item {item_dict['inventoryItemId']}: {e.detail}")
        print(f"Order {order_id} cancelled. Inventory adjusted.")
        
    elif status_val == "confirmed" and original_status == "pending":
        print(f"Order {order_id} confirmed.")
        
    elif status_val == "completed" and original_status != "completed":
        print(f"Order {order_id} marked as completed.")

    orders[index]["status"] = status_val
    
    order_copy = orders[index].copy()
    order_copy["items"] = [OrderItem(**item) for item in order_copy["items"]]
    return Order(**order_copy)

@app.delete("/orders/{order_id}", status_code=204)
def cancel_order(order_id: str):
    try:
        update_order_status(order_id, StatusUpdate(status="cancelled"))
    except HTTPException as e:
        if e.status_code == 404:
            raise HTTPException(status_code=404, detail="Order not found")
        raise e
    return


# --- Forecasting API Routes ---

# In-memory storage for generated forecasts
forecasts_cache = {}

@app.get("/forecast", response_model=Forecast)
def get_demand_forecast(weeks: int = 4):
    # Use today's date as the start
    start_date = date.today()
    end_date = start_date + timedelta(weeks=weeks)
    cache_key = f"{start_date.isoformat()}-{weeks}"
    # Return cached if available
    if cache_key in forecasts_cache:
        return Forecast(**forecasts_cache[cache_key])
    # Prepare historical data
    historical_days = 60
    sales_records = get_historical_sales(days=historical_days)
    # Build DataFrame for Prophet
    df = pd.DataFrame([
        {"ds": rec.date, "y": rec.totalTraysSold}
        for rec in sales_records
    ])
    predictions: List[ForecastPoint] = []
    try:
        if len(df) >= 2:
            model = Prophet(daily_seasonality=True, yearly_seasonality=True)
            model.fit(df)
            future = model.make_future_dataframe(periods=weeks * 7)
            forecast_df = model.predict(future)
            # Filter to prediction period
            mask = (forecast_df["ds"].dt.date >= start_date) & (forecast_df["ds"].dt.date <= end_date)
            for _, row in forecast_df.loc[mask].iterrows():
                predictions.append(
                    ForecastPoint(date=row["ds"].date(), predictedTrays=round(row["yhat"], 1))
                )
        # Fallback if not enough data
        if not predictions:
            avg = df["y"].mean() if not df.empty else 0
            for i in range(weeks * 7):
                pred_date = start_date + timedelta(days=i)
                predictions.append(ForecastPoint(date=pred_date, predictedTrays=round(avg, 1)))
    except Exception as e:
        print(f"Forecasting error: {e}")
        # Fallback to simple average
        avg = df["y"].mean() if not df.empty else 0
        predictions = [ForecastPoint(date=start_date + timedelta(days=i), predictedTrays=round(avg, 1)) for i in range(weeks * 7)]
    # Build result and cache
    forecast_result = Forecast(periodStart=start_date, periodEnd=end_date, predictions=predictions)
    forecasts_cache[cache_key] = forecast_result.dict()
    return forecast_result

# Endpoint to get historical sales data (can be used by forecast chart)
@app.get("/historical-sales", response_model=List[SalesRecord])
def get_historical_sales(days: int = 90):
    sales_by_date = defaultdict(int)
    end_hist_date = datetime.now()
    start_hist_date = end_hist_date - timedelta(days=days)
    
    for order_dict in orders:
         if order_dict["status"] == "completed": # Only completed orders
            order_date = order_dict["orderDate"]
            if start_hist_date <= order_date <= end_hist_date:
                order_day = order_date.date()
                trays_in_order = sum(item["quantity"] for item in order_dict["items"])
                sales_by_date[order_day] += trays_in_order
                
    sales_records = [
        SalesRecord(date=d, totalTraysSold=count)
        for d, count in sorted(sales_by_date.items())
    ]
    return sales_records
    

# --- END Forecasting API Routes ---



@app.get("/dashboard-data")
def get_dashboard_data():
    # Calculate KPIs for the dashboard
    
    # Total trays in production (from plantings)
    growing_trays = sum(p["tray_count"] for p in plantings if p["status"] in ["planted", "growing"])
    
    # Total trays in storage (from inventory)
    storage_trays = sum(i["trayCount"] for i in inventory_items if i["status"] == "in-storage")
    
    # Average yield per tray (from harvests)
    total_yield = sum(h["actual_yield"] for h in harvests)
    total_harvested_trays = sum(
        p["tray_count"] for p in plantings 
        if p["id"] in [h["planting_id"] for h in harvests]
    )
    avg_yield_per_tray = total_yield / total_harvested_trays if total_harvested_trays > 0 else 0
    
    # Revenue in the last 30 days (from orders)
    recent_orders_list = [o for o in orders if o["orderDate"] > datetime.now() - timedelta(days=30) and o["status"] != "cancelled"]
    recent_revenue = sum(o["total_price"] or 0 for o in recent_orders_list)
    
    # Top performing varieties by yield (from harvests)
    variety_yields = defaultdict(lambda: {"total_yield": 0, "tray_count": 0})
    for h in harvests:
        planting = next((p for p in plantings if p["id"] == h["planting_id"]), None)
        if planting: variety_yields[planting["variety_id"]]["total_yield"] += h["actual_yield"]
        if planting: variety_yields[planting["variety_id"]]["tray_count"] += planting["tray_count"]
    
    top_varieties = []
    for variety_id, data in variety_yields.items():
        variety = next((v for v in varieties if v["id"] == variety_id), None)
        if not variety: continue
        if data["tray_count"] > 0 and variety["expected_yield_per_tray"] > 0:
            yield_per = data["total_yield"] / data["tray_count"]
            performance = round((yield_per / variety["expected_yield_per_tray"]) * 100, 1)
            top_varieties.append({
                "id": variety_id,
                "name": variety["name"],
                "yield_per_tray": round(yield_per, 2),
                "expected_yield_per_tray": variety["expected_yield_per_tray"],
                "performance": performance
            })
        elif data["tray_count"] > 0: # Handle zero expected yield case
             top_varieties.append({
                "id": variety_id,
                "name": variety["name"],
                "yield_per_tray": round(data["total_yield"] / data["tray_count"], 2),
                "expected_yield_per_tray": variety["expected_yield_per_tray"],
                "performance": 0 # Or None, or some indicator
            })
    
    top_varieties.sort(key=lambda x: x["yield_per_tray"], reverse=True)
    
    # Upcoming harvests (from plantings)
    upcoming_harvests = [
        {
            "id": p["id"],
            "variety": next((v["name"] for v in varieties if v["id"] == p["variety_id"]), "Unknown"),
            "expected_harvest_date": p["expected_harvest_date"],
            "tray_count": p["tray_count"],
            "expected_yield": p["tray_count"] * next((v["expected_yield_per_tray"] for v in varieties if v["id"] == p["variety_id"]), 0)
        }
        for p in plantings
        if p["status"] == "growing" and p["expected_harvest_date"] > datetime.now()
    ]
    upcoming_harvests.sort(key=lambda x: x["expected_harvest_date"])
    
    # Forecast demand based on historical orders
    variety_demand = {}
    for order_dict in orders:
        if order_dict["status"] == "cancelled": continue # Exclude cancelled orders from forecast
        order_date = order_dict["orderDate"]
        if order_date > datetime.now() - timedelta(days=60):
            for item_dict in order_dict["items"]:
                # Need variety ID. Let's find it via name for simplicity (less robust)
                variety_name = item_dict["variety"]
                variety = next((v for v in varieties if v["name"] == variety_name), None)
                if not variety: continue 
                variety_id = variety["id"]
                
                if variety_id not in variety_demand:
                    variety_demand[variety_id] = {"total_quantity": 0}
                variety_demand[variety_id]["total_quantity"] += item_dict["quantity"]
    
    demand_forecast_list = []
    for variety_id, data in variety_demand.items():
        daily = data["total_quantity"] / 60
        variety = next((v for v in varieties if v["id"] == variety_id), None)
        if variety:
            demand_forecast_list.append({
                "id": variety_id,
                "name": variety["name"],
                "daily_demand": round(daily, 2),
                "weekly_demand": round(daily * 7, 2),
                "monthly_demand": round(daily * 30, 2)
            })
    
    demand_forecast_list.sort(key=lambda x: x["monthly_demand"], reverse=True)
    
    return {
        "kpis": {
            "active_trays": growing_trays,
            "storage_trays": storage_trays,
            "avg_yield_per_tray": round(avg_yield_per_tray, 2),
            "recent_revenue": round(recent_revenue, 2),
            "harvests_last_30_days": len([h for h in harvests if h["harvest_date"] > datetime.now() - timedelta(days=30)]),
            "orders_last_30_days": len(recent_orders_list)
        },
        "top_varieties": top_varieties[:5],
        "upcoming_harvests": upcoming_harvests[:5],
        "demand_forecast": demand_forecast_list
    }

# Add PlantingCreate model for new plantings
class PlantingCreate(BaseModel):
    variety_id: int
    plant_date: datetime
    tray_count: int = 1
    notes: Optional[str] = None

# Add endpoint to create a new planting
@app.post("/plantings", response_model=TrayPlanting, status_code=201)
def create_planting(planting_data: PlantingCreate):
    # Lookup variety
    variety = next((v for v in varieties if v["id"] == planting_data.variety_id), None)
    if not variety:
        raise HTTPException(status_code=404, detail="Variety not found")
    # Calculate expected harvest and initial status
    expected_date = planting_data.plant_date + timedelta(days=variety["grow_cycle_days"])
    status = "planted"
    if planting_data.plant_date < datetime.now() - timedelta(days=1):
        status = "growing"
    if expected_date <= datetime.now():
        status = "ready"
    # Generate new ID
    new_id = max((p["id"] for p in plantings), default=0) + 1
    planting_dict = {
        "id": new_id,
        "variety_id": planting_data.variety_id,
        "plant_date": planting_data.plant_date,
        "expected_harvest_date": expected_date,
        "status": status,
        "tray_count": planting_data.tray_count
    }
    plantings.append(planting_dict)
    return TrayPlanting(**planting_dict)

# Run the app with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 