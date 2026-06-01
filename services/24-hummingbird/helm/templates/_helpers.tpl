{{/*
Expand the name of the chart.
*/}}
{{- define "24-hummingbird.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "24-hummingbird.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "24-hummingbird.labels" -}}
helm.sh/chart: {{ include "24-hummingbird.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "24-hummingbird.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "24-hummingbird.selectorLabels" -}}
app.kubernetes.io/name: {{ include "24-hummingbird.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "24-hummingbird.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "24-hummingbird.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
