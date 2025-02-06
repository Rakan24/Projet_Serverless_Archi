# Backend pour le projet Serverless CSV Upload

## Prérequis

- Python 3.x
- AWS S3 Bucket configuré avec des clés d'accès AWS

## Installation

1. Clonez le projet :
    ```bash
    git clone https://github.com/ton-utilisateur/ton-repository.git
    cd ton-repository/backend
    ```

2. Installez les dépendances :
    ```bash
    pip install -r requirements.txt
    ```

3. Configurez vos variables d'environnement dans un fichier `.env` à la racine du projet :
    ```
    S3_BUCKET_NAME=ton_bucket_s3
    AWS_ACCESS_KEY_ID=ta_clé_access
    AWS_SECRET_ACCESS_KEY=ta_clé_secrète
    ```

4. Lancez l'application Flask :
    ```bash
    python app.py
    ```

L'API sera disponible sur `http://localhost:5000/upload`.
