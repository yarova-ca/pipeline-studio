{{/*
Expand the name of the chart.
*/}}
{{- define "13-workbox.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "13-workbox.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "13-workbox.labels" -}}
helm.sh/chart: {{ include "13-workbox.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "13-workbox.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "13-workbox.selectorLabels" -}}
app.kubernetes.io/name: {{ include "13-workbox.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "13-workbox.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "13-workbox.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
