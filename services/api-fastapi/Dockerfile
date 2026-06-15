FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -r -u 10001 app && chown -R app /app
USER app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=8s \
  CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:8080/health')" || exit 1
CMD ["uvicorn","src.main:app","--host","0.0.0.0","--port","8080"]
