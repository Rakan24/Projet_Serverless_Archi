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



#Route pour upload un fichier CSV sur AZURE

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


#Route pour récupérer TOUS les fichiers json sur AZURE

@app.route('/list-json-files', methods=['GET'])
def list_json_files():
    try:
        # Vérifie si Azure est configuré
        if AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY and AZURE_CONTAINER_NAME:
            # Liste des fichiers JSON dans le conteneur Azure
            blob_list = container_client.list_blobs(name_starts_with='')  # Lister tous les fichiers
            files = [blob.name for blob in blob_list if blob.name.endswith('.json')]  # Filtrer uniquement les fichiers .json

            # Si aucun fichier JSON n'est trouvé, renvoie une réponse vide
            if not files:
                return jsonify({
                    "status": "success",
                    "message": "Aucun fichier JSON trouvé.",
                    "files": []
                }), 200
        else:
            # Si tu utilises un stockage local
            files = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith('.json')]

        # Renvoie la liste des fichiers JSON trouvés
        return jsonify({
            "status": "success",
            "files": files
        }), 200

    except Exception as e:
        print(f"Erreur lors de la récupération des fichiers JSON: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la récupération des fichiers : {str(e)}"
        }), 500


#Route pour afficher contenu du json cliqué 

@app.route('/get-json-file/<filename>', methods=['GET'])
def get_json_file(filename):
    try:
        # Vérifie si le fichier existe dans Azure Blob Storage
        blob_client = container_client.get_blob_client(filename)
        
        if blob_client.exists():
            json_data = blob_client.download_blob().readall().decode('utf-8')
            return jsonify({"status": "success", "data": json_data}), 200
        else:
            return jsonify({"status": "error", "message": f"Le fichier {filename} n'existe pas."}), 404
    
    except Exception as e:
        print(f"Erreur lors de la récupération du fichier JSON {filename}: {str(e)}")
        return jsonify({"status": "error", "message": f"Erreur lors de la récupération du fichier : {str(e)}"}), 500






#ROUTE A SUPPR ?????
@app.route('/get-result', methods=['GET'])
def get_analysis_result():
    try:
        # Nom fixe du fichier result.json
        json_filename = "result.json"
        
        if AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY and AZURE_CONTAINER_NAME:
            # Récupère le fichier JSON depuis Azure Blob Storage
            blob_client = container_client.get_blob_client(json_filename)
            if blob_client.exists():
                json_data = blob_client.download_blob().readall().decode('utf-8')
                return jsonify({"status": "success", "data": json_data}), 200
            else:
                return jsonify({"status": "error", "message": f"Le fichier {json_filename} n'existe pas."}), 404
        else:
            # Récupère le fichier JSON depuis le stockage local
            file_path = os.path.join(UPLOAD_FOLDER, json_filename)
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as json_file:
                    json_data = json_file.read()
                return jsonify({"status": "success", "data": json_data}), 200
            else:
                return jsonify({"status": "error", "message": f"Le fichier {json_filename} n'existe pas."}), 404
    except Exception as e:
        print(f"Erreur lors de la récupération du fichier JSON : {str(e)}")
        return jsonify({"status": "error", "message": f"Erreur lors de la récupération : {str(e)}"}), 500



if __name__ == '__main__':
    app.run(debug=True)
