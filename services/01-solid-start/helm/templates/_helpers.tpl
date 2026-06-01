{{/*
Expand the name of the chart.
*/}}
{{- define "01-solid-start.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "01-solid-start.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "01-solid-start.labels" -}}
helm.sh/chart: {{ include "01-solid-start.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "01-solid-start.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "01-solid-start.selectorLabels" -}}
app.kubernetes.io/name: {{ include "01-solid-start.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "01-solid-start.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "01-solid-start.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
