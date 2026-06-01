{{/*
Expand the name of the chart.
*/}}
{{- define "03-eleventy.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "03-eleventy.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "03-eleventy.labels" -}}
helm.sh/chart: {{ include "03-eleventy.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "03-eleventy.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "03-eleventy.selectorLabels" -}}
app.kubernetes.io/name: {{ include "03-eleventy.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "03-eleventy.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "03-eleventy.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
