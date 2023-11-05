from datasets import load_dataset
import requests
import time

# Load the dataset
dataset = load_dataset("brianarbuckle/cocktail_recipes", split="train[200:300]") # Only load first 100 recipes

def send_to_api(data):
    api_url = "https://cocktail-rag.beefie.xyz/doc/add"
    print("-----------------------------------------------")
    print(f"Data Length: {len(data)}")
    print(data)
    payload = {"data": data}
    response = requests.post(api_url, json=payload)
    
    if response.status_code == 200:
        print("Successfully sent data to API.")
    else:
        print("Failed to send data to API.")
    time.sleep(0.5)

# Iterate over the dataset
for item in dataset:
    # Create an array of strings to hold the recipe information
    recipe_details = [
        f"Title: {item['title']}\n",
        f"Keywords: {', '.join(item['ner'])}\n",
        "Ingredients:\n" + "\n".join([f"- {ingredient}" for ingredient in item['ingredients']]) + "\n",
        "Directions:\n" + "\n".join([f"- {direction}" for direction in item['directions']]) + "\n",
        f"Source: {item['source']}\n"
    ]
    
    # Join all the strings in the array with newline characters
    full_recipe = "\n".join(recipe_details)
    
    # Send the full recipe string to the API
    send_to_api(full_recipe)
