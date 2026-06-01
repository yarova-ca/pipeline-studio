{{/*
Expand the name of the chart.
*/}}
{{- define "02-preact.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "02-preact.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "02-preact.labels" -}}
helm.sh/chart: {{ include "02-preact.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "02-preact.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "02-preact.selectorLabels" -}}
app.kubernetes.io/name: {{ include "02-preact.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "02-preact.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "02-preact.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
