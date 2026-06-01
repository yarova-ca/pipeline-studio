{{/*
Expand the name of the chart.
*/}}
{{- define "30-ws-go.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "30-ws-go.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "30-ws-go.labels" -}}
helm.sh/chart: {{ include "30-ws-go.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "30-ws-go.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "30-ws-go.selectorLabels" -}}
app.kubernetes.io/name: {{ include "30-ws-go.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "30-ws-go.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "30-ws-go.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
