import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
import pandas as pd
import numpy as np

# Charge les variables depuis le fichier .env
load_dotenv()

# Récupération des variables d'environnement
AZURE_STORAGE_ACCOUNT_NAME = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
AZURE_STORAGE_ACCOUNT_KEY = os.getenv("AZURE_STORAGE_ACCOUNT_KEY")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME")

app = Flask(__name__)

# Active CORS pour autoriser toutes les origines
CORS(app, resources={r"/*": {"origins": "*"}})

# Si les variables Azure sont définies, on utilise Azure Blob Storage. Sinon, on utilise un stockage local.
if AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY and AZURE_CONTAINER_NAME:
    from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient

    # Initialisation de la connexion à Azure Blob Storage
    blob_service_client = BlobServiceClient(account_url=f"https://{AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net", credential=AZURE_STORAGE_ACCOUNT_KEY)
    container_client = blob_service_client.get_container_client(AZURE_CONTAINER_NAME)

    def upload_file_azure(file):
        try:
            # Upload le fichier sur Azure Blob Storage
            blob_client = container_client.get_blob_client(file.filename)
            blob_client.upload_blob(file, overwrite=True)  # L'option overwrite est ajoutée pour éviter les conflits de noms
            return f"Fichier '{file.filename}' téléchargé avec succès sur Azure Blob Storage."
        except Exception as e:
            # Si une erreur survient, affiche un message d'erreur
            return f"Erreur lors de l'upload sur Azure : {str(e)}"
    
    
else:
    # Si Azure n'est pas configuré, on utilise un stockage local
    UPLOAD_FOLDER = 'uploads'
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

    def upload_file_local(file):
        # Sauvegarde le fichier localement
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        return f"Fichier '{file.filename}' téléchargé avec succès en local."

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        print("Aucun fichier sélectionné")
        return jsonify({"message": "Aucun fichier sélectionné", "status": "error"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        print("Le nom du fichier est vide")
        return jsonify({"message": "Le nom du fichier est vide", "status": "error"}), 400

    try:
        print(f"Uploading file: {file.filename}")
        if AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY and AZURE_CONTAINER_NAME:
            # Utilise Azure Blob Storage pour l'upload
            message = upload_file_azure(file)
        else:
            # Utilise le stockage local
            message = upload_file_local(file)
        
        return jsonify({"message": message, "status": "success"}), 200
    except Exception as e:
        print(f"Erreur lors de l'upload : {str(e)}")
        return jsonify({"message": f"Erreur lors de l'upload : {str(e)}", "status": "error"}), 500



if __name__ == '__main__':
    app.run(debug=True)
