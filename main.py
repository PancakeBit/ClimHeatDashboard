import threading

import firebase_admin
import secrets
from socket import gethostname
import requests
import asyncio
from datetime import datetime, timedelta
from flask import Flask, render_template, redirect, url_for, request, flash, session, send_from_directory
from firebase_admin import credentials, firestore, db, auth
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, login_user, login_required, logout_user, UserMixin, current_user
from flask_jwt_extended import JWTManager, create_access_token

# TODO: Bug: The "flash" function from Flask does not show any text when it is supposed to

# Create a Flask application instance
app = Flask(__name__)


# TODO: SET ACTUAL SECRET KEY AS A RANDOMLY GENERATED STRING
app.config['SECRET_KEY'] = secrets.token_urlsafe(16)
login_manager = LoginManager(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Initialize Firebase credentials, use absolute path when uploading to Python Anywhere
# When uploaded to pythoinanywhere, change to "/home/pancakebit/Climheat/static/climheat-key.json"
cred = credentials.Certificate('static/climheat-key.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://climheat-5f408-default-rtdb.asia-southeast1.firebasedatabase.app/'
})
fsdb = firestore.client()

adminperms = False


# Set login manager of Flask
@login_manager.user_loader
def load_user(user_id):
    user_doc = fsdb.collection('users').document(user_id).get()
    global adminperms
    if user_doc.exists:
        user_data = user_doc.to_dict()
        if user_data['perms'] == 'admin':
            adminperms = True
        return User(user_id, user_data['username'], user_data['perms'])
    return None


# User Class
class User(UserMixin):
    def __init__(self, id, username, perms):
        self.id = id
        self.username = username
        self.perms = perms

# Registration Page, if called with a Post method add to firestore
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # TODO: Add error catch if user fails to register or if username/user_id is already registered
        email = request.form['email']
        password = request.form['password']
        try:
            # Create the user in Firebase Authentication
            user = auth.create_user(
                email=email,
                password=password
            )
            flash('Account created successfully! You can now log in.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            flash(f'Error creating user: {str(e)}', 'danger')
            return redirect(url_for('register'))
    return render_template('registration.html')

# Login Page, if called with a Post method check credentials with Firestore
@app.route('/login', methods=['GET', 'POST'])
@app.route('/login.html', methods=['GET', 'POST'])
def login():
    global adminperms
    # If user is already logged in, redirect to main page
    if 'user' in session:
        return redirect("index.html")
    if request.method == 'POST':
        FIREBASE_API_KEY = "AIzaSyA9E2A3a5Vtv01QmZHVqccuPIAX6sPnJXc"
        firebase_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
        email = request.form['email']
        password = request.form['password']
        try:
            payload = {
                "email": email,
                "password": password,
                "returnSecureToken": True
            }
            response = requests.post(firebase_url, json=payload)
            result = response.json()
            # Verify the user's credentials via Firebase Authentication
            user = auth.get_user_by_email(email)
            role = user.custom_claims.get('role', 'default')
            if role == 'admin':
                adminperms = True
            if response.status_code == 200:
                session['user_id'] = result['localId']
                session['id_token'] = result['idToken']  # Store the ID token for further authentication
                session['user'] = user.email
                flash(f'Logged in successfully as {user.email}', 'success')
                return redirect(url_for('home'))
            else:
                print(response.json())
        except Exception as e:
            print(e)
            flash(f'Login failed: {str(e)}', 'danger')
            return redirect(url_for('login'))
    return render_template('login.html')


# Default URL, if user is not logged in then redirect to login page
@app.route('/')
def home():
    if 'user' not in session:
        return redirect("index.html")
    else:return render_template("index.html")

#Main Home Page, if not authenticated redirect to Login
@app.route('/index')
@app.route('/index.html')
def mainDashboard():
    if 'user' not in session:
        return redirect("login.html")
    return render_template("index.html", adminperms=adminperms, email=session['user'])

@app.route('/logout')
@app.route('/logout.html')
def logout():
    session.pop('user', None)
    session.pop('role', None)
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))

@app.route('/oview')
@app.route('/oview.html')
def overviewPage():
    if 'user' not in session:
        return redirect("login.html")
    return render_template("oview.html", email=session['user'])


@app.route('/districts')
@app.route('/districts.html')
def districtsPage():
    if 'user' not in session:
        return redirect("login.html")
    return render_template("districts.html", adminperms=adminperms, email=session['user'])

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)


async def updateFirebaseRealtimeDB():
    today = datetime.today().strftime('%d%B%Y')
    sorted_data = getHighestTempsForBarangays()
    ref = db.reference('Barangay List/' + today)  # Adjust the Firebase path as needed
    ref.set(sorted_data)
    print(f"Updated Firebase with sorted data at {datetime.now()}")

def getHighestTempsForBarangays():
    barangay_coords = {
        "Apolonio Samson": {"lat": 14.655309849980318, "long": 121.01159460020295},
        "Baesa": {"lat": 14.674639944800129, "long": 121.0134206679377},
        "Balong Bato": {"lat": 14.608380618029102, "long": 121.02352749585779},
        "Culiat": {"lat": 14.667972601513892, "long": 121.05667298120255},
        "New Era": {"lat": 14.664747890509634, "long": 121.05958063621685},
        "Pasong Tamo": {"lat": 14.674773358844922, "long": 121.0481886197324},
        "Sangandaan": {"lat": 14.674146140551445, "long": 121.02062810933921},
        "Sauyo": {"lat": 14.689499112512255, "long": 121.03361599901578},
        "Talipapa": {"lat": 14.687678705704203, "long": 121.02534595907845},
        "Tandang Sora": {"lat": 14.681888013966427, "long": 121.03228609832858},
        "Unang Sigaw": {"lat": 14.658603132201728, "long": 120.99962414018988},
    }
    temperatures_for_each = {}
    apikey = "ab3b138474fe3eec33d92c308fd27126"

    for key in barangay_coords:
        hottest_temp = 0
        hottest_time = 0
        description = ""
        getWeatherAPI = f"https://api.openweathermap.org/data/2.5/forecast?lat={barangay_coords[key]['lat']}&lon={barangay_coords[key]['long']}&units=metric&cnt=8&appid={apikey}"
        try:
            jsonresponse = requests.get(getWeatherAPI).json()
        except requests.exceptions as e:
            print(e)
            return None
        listofdays = jsonresponse['list']

        for day, item in enumerate(listofdays):
            if listofdays[day]['main']['feels_like'] > hottest_temp:
                hottest_temp = listofdays[day]['main']['feels_like']
                description = listofdays[day]['weather'][0]['description']
                hottest_time = day
        temperatures_for_each[key] = {"hottest_temp": hottest_temp, "description": description, }

    return temperatures_for_each

def timeUntilMidnight():
    now = datetime.now()
    next_midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return (next_midnight - now).total_seconds()

dataInputtedToday = False
def checkIfDataExistsForToday():
    today = datetime.today().strftime('%d%B%Y')
    todaystemps = db.reference("/Barangay List/" + today)
    dataToday = todaystemps.get()
    return dataToday is not None  # Return True if data exists, False if not

def checkDataOnStartup():
    global dataInputtedToday
    dataInputtedToday = checkIfDataExistsForToday()
    if dataInputtedToday:
        print("Today's data already exists in Firebase.")
    else:
        print("Today's data is not yet in Firebase. Update will be performed.")


async def runAtMidnight():
    global dataInputtedToday

    if dataInputtedToday:
        print("Data for today already exists. Skipping today's update.")
    else:
        # Update Firebase right away if data hasn't been inputted yet
        await updateFirebaseRealtimeDB()

    while True:
        # Try to get today's temperature from firebase
        # Wait until the next 12:00 AM
        seconds_until_midnight = timeUntilMidnight()
        print(seconds_until_midnight, "Until Midnight")
        await asyncio.sleep(seconds_until_midnight)
        # TODO: If database is empty at the time of running the server, then run this function once
        # Run the Firebase update at midnight
        await updateFirebaseRealtimeDB()

def classifyClothing(temp, description):
    recommendation = ""

    # Classify based on temperature
    if temp > 35:
        recommendation += "It is extremely hot, please stay hydrated and wear light clothing."
    elif 35 <= temp > 30:
        recommendation += "Wear light clothing like shorts and a t-shirt."
    elif 20 <= temp <= 30:
        recommendation += "Comfortable casual clothing, such as a t-shirt and jeans, is recommended."
    elif 10 <= temp < 20:
        recommendation += "It's getting cooler, consider wearing a light jacket and long sleeves."
    else:
        recommendation += "It's cold, wear warm clothing like a heavy jacket, scarf, and gloves."

    # Additions based on weather description
    if "rain" in description.lower():
        recommendation += " Don't forget an umbrella."

    return recommendation

def adminPanel():
    if 'role' not in session or session['role'] != 'admin':
        flash('You do not have permission to access this page', 'danger')
        return redirect(url_for('home'))
    return render_template('admin_panel.html')


async def main():
    # Start both the web server and the scheduled task concurrently
    if 'liveconsole' not in gethostname():
        await asyncio.gather(
            runAtMidnight(),  # Firebase update task
            asyncio.to_thread(app.run)  # Flask server running in a separate thread
        )
    else:
        await asyncio.gather(
            runAtMidnight(),  # Firebase update task
        )

# If any functions need to be ran before the server starts, place them here



# Check if the file is being executed directly (i.e., not being imported)
# When uploading to PythonAnywhere, read "https://help.pythonanywhere.com/pages/Flask/"
if __name__ == '__main__':
    checkDataOnStartup()
    asyncio.run(main())

# This code is for manually setting an email of a user into an Admin
'''
    user_email = "winmarkchan@gmail.com"
    try:
        # Get the user by their email
        user = auth.get_user_by_email(user_email)
        # Set custom claims (in this case, admin role)
        auth.set_custom_user_claims(user.uid, {'role': 'admin'})
        print(f"Admin role assigned to {user_email}")
    except Exception as e:
        print(f"Error setting admin role: {str(e)}")
'''