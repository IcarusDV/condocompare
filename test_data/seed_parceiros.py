#!/usr/bin/env python3
import json
import requests

BASE_URL = "http://localhost:8080/api/v1/parceiros"

def main():
    # Load parceiros from JSON
    with open("/home/icarusvicare/Documentos/CondoCompare/test_data/parceiros_seed.json", "r") as f:
        parceiros = json.load(f)

    print(f"Creating {len(parceiros)} parceiros...")

    success = 0
    failed = 0

    for parceiro in parceiros:
        try:
            response = requests.post(BASE_URL, json=parceiro)
            if response.status_code in [200, 201]:
                print(f"Created: {parceiro['nomeFantasia']}")
                success += 1
            else:
                print(f"Failed ({response.status_code}): {parceiro['nomeFantasia']} - {response.text[:100]}")
                failed += 1
        except Exception as e:
            print(f"Error: {parceiro['nomeFantasia']} - {str(e)}")
            failed += 1

    print(f"\nDone! Success: {success}, Failed: {failed}")

if __name__ == "__main__":
    main()
