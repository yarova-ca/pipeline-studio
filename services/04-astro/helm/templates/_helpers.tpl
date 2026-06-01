{{/*
Expand the name of the chart.
*/}}
{{- define "04-astro.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "04-astro.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "04-astro.labels" -}}
helm.sh/chart: {{ include "04-astro.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "04-astro.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "04-astro.selectorLabels" -}}
app.kubernetes.io/name: {{ include "04-astro.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "04-astro.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "04-astro.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
