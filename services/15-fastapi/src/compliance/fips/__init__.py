import ssl, os
from fastapi import FastAPI
def apply_compliance(app: FastAPI) -> None:
    if not ssl.OPENSSL_VERSION.lower().count("fips") and not os.getenv("OPENSSL_FIPS"):
        raise RuntimeError("FIPS: non-FIPS OpenSSL — build with RUNTIME=fips")
