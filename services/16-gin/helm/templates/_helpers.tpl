{{/*
Expand the name of the chart.
*/}}
{{- define "16-gin.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "16-gin.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "16-gin.labels" -}}
helm.sh/chart: {{ include "16-gin.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "16-gin.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "16-gin.selectorLabels" -}}
app.kubernetes.io/name: {{ include "16-gin.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "16-gin.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "16-gin.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
