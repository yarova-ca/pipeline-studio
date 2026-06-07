from fastapi import FastAPI; import os
def init_observability(app):
    import ddtrace; ddtrace.patch_all()
    ddtrace.config.service = os.getenv("DD_SERVICE","15-fastapi")
