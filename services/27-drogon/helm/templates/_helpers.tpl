{{/*
Expand the name of the chart.
*/}}
{{- define "27-drogon.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "27-drogon.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "27-drogon.labels" -}}
helm.sh/chart: {{ include "27-drogon.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "27-drogon.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "27-drogon.selectorLabels" -}}
app.kubernetes.io/name: {{ include "27-drogon.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "27-drogon.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "27-drogon.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
