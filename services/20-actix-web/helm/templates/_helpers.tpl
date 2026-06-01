{{/*
Expand the name of the chart.
*/}}
{{- define "20-actix-web.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "20-actix-web.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "20-actix-web.labels" -}}
helm.sh/chart: {{ include "20-actix-web.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "20-actix-web.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "20-actix-web.selectorLabels" -}}
app.kubernetes.io/name: {{ include "20-actix-web.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "20-actix-web.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "20-actix-web.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
