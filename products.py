from flask import Blueprint, request, jsonify
from models import db, Product
from utils import admin_required

products_bp = Blueprint('products', __name__)

@products_bp.route('', methods=['GET'])
def get_products():
    products = Product.query.all()
    result = []
    for p in products:
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "stockQuantity": p.stockQuantity
        })
    return jsonify(result), 200

@products_bp.route('', methods=['POST'])
@admin_required
def add_product(current_user):
    data = request.get_json()
    
    new_product = Product(
        name=data.get('name'),
        description=data.get('description'),
        price=data.get('price'),
        stockQuantity=data.get('stockQuantity')
    )
    
    db.session.add(new_product)
    db.session.commit()
    
    return jsonify({
        "id": new_product.id,
        "name": new_product.name,
        "description": new_product.description,
        "price": new_product.price,
        "stockQuantity": new_product.stockQuantity
    }), 201

@products_bp.route('/bulk', methods=['POST'])
@admin_required
def add_products_bulk(current_user):
    data_list = request.get_json()
    
    new_products = []
    for data in data_list:
        p = Product(
            name=data.get('name'),
            description=data.get('description'),
            price=data.get('price'),
            stockQuantity=data.get('stockQuantity')
        )
        db.session.add(p)
        new_products.append(p)
        
    db.session.commit()
    
    result = []
    for p in new_products:
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "stockQuantity": p.stockQuantity
        })
        
    return jsonify(result), 201

@products_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_product(current_user, id):
    product = Product.query.get(id)
    if not product:
        return "Product not found", 404
        
    db.session.delete(product)
    db.session.commit()
    
    return '', 204
