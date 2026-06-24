import datetime
from flask import Blueprint, request, jsonify
from models import db, Order, OrderItem, Product
from utils import token_required

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('', methods=['POST'])
@token_required
def place_order(current_user):
    order_requests = request.get_json()
    if not order_requests:
        return "Invalid order request", 400
        
    total_amount = 0.0
    items_to_create = []
    products_to_update = []
    
    for item_req in order_requests:
        product_id = item_req.get('productId')
        quantity = item_req.get('quantity')
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": f"Product not found with id: {product_id}"}), 404
            
        if product.stockQuantity < quantity:
            return jsonify({"error": f"Insufficient stock for product: {product.name}"}), 400
            
        # Deduct stock
        product.stockQuantity -= quantity
        products_to_update.append(product)
        
        # Calculate price and items
        price = product.price
        total_amount += price * quantity
        
        items_to_create.append({
            "product": product,
            "quantity": quantity,
            "price": price
        })
        
    # Create Order
    new_order = Order(
        user_id=current_user.id,
        totalAmount=total_amount
    )
    db.session.add(new_order)
    db.session.flush() # flush to get the new_order.id
    
    # Create OrderItems
    for item in items_to_create:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item['product'].id,
            quantity=item['quantity'],
            price=item['price']
        )
        db.session.add(order_item)
        
    db.session.commit()
    
    # Return 201 matching Java
    return "Order placed successfully", 201


@orders_bp.route('', methods=['GET'])
@token_required
def get_user_orders(current_user):
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.orderDate.desc()).all()
    
    result = []
    for order in orders:
        items_list = []
        for row in order.items: # Note: 'items' comes from Order.items relationship defined in models
            # The Java backend nested the entire product details inside each order item
            items_list.append({
                "id": row.id,
                "price": row.price,
                "quantity": row.quantity,
                "product": {
                    "id": row.product.id,
                    "name": row.product.name,
                    "description": row.product.description,
                    "price": row.product.price,
                    "stockQuantity": row.product.stockQuantity
                }
            })
            
        # Format the datetime similar to what Jackson does in Java
        date_str = order.orderDate.strftime("%Y-%m-%dT%H:%M:%S.%f")
        
        result.append({
            "id": order.id,
            "totalAmount": order.totalAmount,
            "orderDate": date_str,
            "items": items_list
        })
        
    return jsonify(result), 200
