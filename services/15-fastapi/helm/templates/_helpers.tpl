{{/*
Expand the name of the chart.
*/}}
{{- define "15-fastapi.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "15-fastapi.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "15-fastapi.labels" -}}
helm.sh/chart: {{ include "15-fastapi.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "15-fastapi.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "15-fastapi.selectorLabels" -}}
app.kubernetes.io/name: {{ include "15-fastapi.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "15-fastapi.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "15-fastapi.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
