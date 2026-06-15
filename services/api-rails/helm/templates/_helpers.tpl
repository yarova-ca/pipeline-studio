{{/*
Expand the name of the chart.
*/}}
{{- define "22-rails.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "22-rails.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "22-rails.labels" -}}
helm.sh/chart: {{ include "22-rails.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "22-rails.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "22-rails.selectorLabels" -}}
app.kubernetes.io/name: {{ include "22-rails.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "22-rails.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "22-rails.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
