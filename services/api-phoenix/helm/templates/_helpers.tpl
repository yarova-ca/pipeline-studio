{{/*
Expand the name of the chart.
*/}}
{{- define "21-phoenix.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "21-phoenix.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "21-phoenix.labels" -}}
helm.sh/chart: {{ include "21-phoenix.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "21-phoenix.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "21-phoenix.selectorLabels" -}}
app.kubernetes.io/name: {{ include "21-phoenix.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "21-phoenix.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "21-phoenix.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
