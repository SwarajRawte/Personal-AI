import requests
import sys

BASE_URL = "http://localhost:8000"

def test_isolation():
    # 1. Signup User A
    user_a = {"username": "user_a_test", "password": "password123"}
    requests.post(f"{BASE_URL}/signup", json=user_a)
    
    # 2. Login User A
    login_a = requests.post(f"{BASE_URL}/login", data={"username": user_a["username"], "password": user_a["password"]}).json()
    token_a = login_a["access_token"]
    
    # 3. Create Task for User A
    task_data = {"title": "User A Task", "description": "Private task"}
    res = requests.post(f"{BASE_URL}/tasks", json=task_data, headers={"Authorization": f"Bearer {token_a}"})
    print(f"User A Task Created: {res.status_code}")
    
    # 4. Signup User B
    user_b = {"username": "user_b_test", "password": "password123"}
    requests.post(f"{BASE_URL}/signup", json=user_b)
    
    # 5. Login User B
    login_b = requests.post(f"{BASE_URL}/login", data={"username": user_b["username"], "password": user_b["password"]}).json()
    token_b = login_b["access_token"]
    
    # 6. Verify User B can NOT see User A's task
    tasks_b = requests.get(f"{BASE_URL}/tasks", headers={"Authorization": f"Bearer {token_b}"}).json()
    print(f"User B Tasks Count: {len(tasks_b)}")
    
    if len(tasks_b) == 0:
        print("SUCCESS: Data isolation verified!")
    else:
        print("FAILURE: User B can see User A's tasks!")
        sys.exit(1)

if __name__ == "__main__":
    try:
        test_isolation()
    except Exception as e:
        print(f"Error during verification: {e}")
