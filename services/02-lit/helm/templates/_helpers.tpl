{{/*
Expand the name of the chart.
*/}}
{{- define "02-lit.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "02-lit.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "02-lit.labels" -}}
helm.sh/chart: {{ include "02-lit.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "02-lit.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "02-lit.selectorLabels" -}}
app.kubernetes.io/name: {{ include "02-lit.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "02-lit.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "02-lit.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
