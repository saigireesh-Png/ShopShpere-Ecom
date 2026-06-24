from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
from utils import generate_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Check if email is taken
    existing_user = User.query.filter_by(email=data.get('email')).first()
    if existing_user:
        return "Email is already taken!", 400
        
    hashed_password = generate_password_hash(data.get('password'), method='pbkdf2:sha256')
    
    new_user = User(
        name=data.get('name'),
        email=data.get('email'),
        password=hashed_password
    )
    
    # Match Java logic: first user or requested as admin gets admin role
    if User.query.count() == 0 or data.get('role') == 'ROLE_ADMIN':
        new_user.role = 'ROLE_ADMIN'
    else:
        new_user.role = 'ROLE_USER'
        
    db.session.add(new_user)
    db.session.commit()
    
    return "User registered successfully", 200

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = User.query.filter_by(email=data.get('email')).first()
    
    if not user or not check_password_hash(user.password, data.get('password')):
        return "Incorrect email or password", 401
        
    token = generate_token(user, current_app.config['SECRET_KEY'])
    
    return jsonify({
        "token": token,
        "role": user.role
    }), 200
