{{/*
Expand the name of the chart.
*/}}
{{- define "16-echo.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "16-echo.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "16-echo.labels" -}}
helm.sh/chart: {{ include "16-echo.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "16-echo.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "16-echo.selectorLabels" -}}
app.kubernetes.io/name: {{ include "16-echo.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "16-echo.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "16-echo.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
