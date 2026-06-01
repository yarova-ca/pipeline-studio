{{/*
Expand the name of the chart.
*/}}
{{- define "18-ktor.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "18-ktor.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "18-ktor.labels" -}}
helm.sh/chart: {{ include "18-ktor.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "18-ktor.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "18-ktor.selectorLabels" -}}
app.kubernetes.io/name: {{ include "18-ktor.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "18-ktor.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "18-ktor.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
