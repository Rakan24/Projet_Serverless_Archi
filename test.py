from azure.storage.blob import BlobServiceClient

# Remplacer par tes informations Azure
AZURE_STORAGE_ACCOUNT_NAME = 'finaltestserverless'
AZURE_STORAGE_ACCOUNT_KEY = 'jb75bGFQoQ0fUVZWbWAUiYN055uZ+HUY/ZpJEJ+8MthzF98M9DrKCQiqqMslXWea9U1oFZLMK9Qe+ASt+7SkgA=='
AZURE_CONTAINER_NAME = 'csv'

try:
    # Connexion au service de blob
    blob_service_client = BlobServiceClient(account_url=f"https://{AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net", credential=AZURE_STORAGE_ACCOUNT_KEY)
    containers = blob_service_client.list_containers()
    
    print("Liste des conteneurs dans ton compte Azure :")
    for container in containers:
        print(container['name'])
except Exception as e:
    print(f"Erreur de connexion à Azure : {str(e)}")
