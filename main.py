import firebase_admin
from flask import Flask, render_template, redirect, url_for, request, flash
from firebase_admin import credentials, firestore
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, login_user, login_required, logout_user, UserMixin, current_user
from flask_jwt_extended import JWTManager, create_access_token


# Create a Flask application instance
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
login_manager = LoginManager(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

cred = credentials.Certificate('static/climheat-key.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://climheat-5f408-default-rtdb.asia-southeast1.firebasedatabase.app/'
})
db = firestore.client()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(UserMixin):
    def __init__(self, id, username):
        self.id = id
        self.username = username

# Load user for login system
@login_manager.user_loader
def load_user(user_id):
    if user_id:
        return User(id=user_id, username="abc")
        #return User(id=user_id, username=user_data['username'])
    return None

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        # Hash the password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        # Add user to Firebase Realtime Database
        user_ref = db.collection('users').document(f"{username}")
        user_ref.set({
            'username': username,
            'password': hashed_password
        })
        flash('Account created successfully!', 'success')
        return redirect(url_for('login'))
    return render_template('registration.html')

@app.route('/login', methods=['GET', 'POST'])
@app.route('/login.html', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        # Get user from Firebase Firestore
        user_doc = db.collection('users').document(username).get()

        if user_doc.exists:
            user_data = user_doc.to_dict()

            # Check the password
            if bcrypt.check_password_hash(user_data['password'], password):
                # Log the user in using Flask-Login
                user = User(id=username, username=user_data['username'])
                login_user(user)

                flash('Login successful!', 'success')
                return redirect(url_for('mainDashboard'))
            else:
                flash('Invalid password.', 'danger')
        else:
            flash('User does not exist.', 'danger')

    return render_template('login.html')

# Define a route for the root URL ("/")
@app.route('/')
def home():
    if current_user.is_authenticated:
        return redirect("index.html")
    else:
        return redirect("login.html")
    return render_template("index.html")

@app.route('/index')
@app.route('/index.html')
@login_required
def mainDashboard():
    if (not current_user.is_authenticated):
        return redirect(login.html)
    return render_template("index.html")

@app.route('/logout')
@app.route('/logout.html')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))

@app.route('/login')
@app.route('/login.html')
def loginPage():
    return render_template("login.html")

@app.route('/oview')
@app.route('/oview.html')
def overviewPage():
    return render_template("oview.html")

@app.route('/districts')
@app.route('/districts.html')
def districtsPage():
    return render_template("districts.html")


# Check if the file is being executed directly (i.e., not being imported)
if __name__ == '__main__':
    app.run(debug=True)