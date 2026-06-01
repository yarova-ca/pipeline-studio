{{/*
Expand the name of the chart.
*/}}
{{- define "15-starlette.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "15-starlette.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "15-starlette.labels" -}}
helm.sh/chart: {{ include "15-starlette.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "15-starlette.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "15-starlette.selectorLabels" -}}
app.kubernetes.io/name: {{ include "15-starlette.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "15-starlette.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "15-starlette.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
