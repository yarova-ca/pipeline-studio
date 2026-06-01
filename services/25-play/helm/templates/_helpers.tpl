{{/*
Expand the name of the chart.
*/}}
{{- define "25-play.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "25-play.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "25-play.labels" -}}
helm.sh/chart: {{ include "25-play.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "25-play.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "25-play.selectorLabels" -}}
app.kubernetes.io/name: {{ include "25-play.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "25-play.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "25-play.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
