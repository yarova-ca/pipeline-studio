{{/*
Expand the name of the chart.
*/}}
{{- define "23-symfony.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "23-symfony.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "23-symfony.labels" -}}
helm.sh/chart: {{ include "23-symfony.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "23-symfony.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "23-symfony.selectorLabels" -}}
app.kubernetes.io/name: {{ include "23-symfony.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "23-symfony.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "23-symfony.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
