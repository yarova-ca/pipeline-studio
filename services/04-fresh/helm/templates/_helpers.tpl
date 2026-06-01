{{/*
Expand the name of the chart.
*/}}
{{- define "04-fresh.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "04-fresh.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "04-fresh.labels" -}}
helm.sh/chart: {{ include "04-fresh.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "04-fresh.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "04-fresh.selectorLabels" -}}
app.kubernetes.io/name: {{ include "04-fresh.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "04-fresh.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "04-fresh.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
