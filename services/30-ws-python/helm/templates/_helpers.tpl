{{/*
Expand the name of the chart.
*/}}
{{- define "30-ws-python.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "30-ws-python.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "30-ws-python.labels" -}}
helm.sh/chart: {{ include "30-ws-python.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "30-ws-python.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "30-ws-python.selectorLabels" -}}
app.kubernetes.io/name: {{ include "30-ws-python.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "30-ws-python.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "30-ws-python.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
