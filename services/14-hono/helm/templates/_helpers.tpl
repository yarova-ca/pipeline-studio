{{/*
Expand the name of the chart.
*/}}
{{- define "14-hono.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "14-hono.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "14-hono.labels" -}}
helm.sh/chart: {{ include "14-hono.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "14-hono.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "14-hono.selectorLabels" -}}
app.kubernetes.io/name: {{ include "14-hono.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "14-hono.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "14-hono.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
