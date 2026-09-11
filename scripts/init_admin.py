"""
Helper script to initialize the first Master Admin user in Firebase Authentication.
Run this script once after connecting your live Firebase project.
"""

import sys
import os
import firebase_admin
from firebase_admin import auth, credentials

def main():
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-key.json")
    if not os.path.exists(cred_path):
        print(f"Error: Could not find '{cred_path}'. Please download your service account JSON from Firebase Console.")
        sys.exit(1)

    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

    admin_email = input("Enter Master Admin Email [admin@ncrb.gov.in]: ").strip() or "admin@ncrb.gov.in"
    admin_pass = input("Enter Master Admin Password [Admin@2026!]: ").strip() or "Admin@2026!"

    try:
        user = auth.get_user_by_email(admin_email)
        print(f"User {admin_email} already exists (UID: {user.uid}). Setting admin claims...")
    except auth.UserNotFoundError:
        user = auth.create_user(
            email=admin_email,
            password=admin_pass,
            display_name="Master Admin (NCRB HQ)"
        )
        print(f"Created Master Admin user: {admin_email} (UID: {user.uid})")

    # Set custom claims for Master Admin
    auth.set_custom_user_claims(user.uid, {
        "role": "admin",
        "badge": "MHA-ADM-001",
        "dept": "NCRB Intelligence Command"
    })

    print("Success! Master Admin user configured with 'admin' role claims.")

if __name__ == "__main__":
    main()
