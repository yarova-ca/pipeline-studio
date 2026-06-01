{{/*
Expand the name of the chart.
*/}}
{{- define "02-vue.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "02-vue.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "02-vue.labels" -}}
helm.sh/chart: {{ include "02-vue.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "02-vue.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "02-vue.selectorLabels" -}}
app.kubernetes.io/name: {{ include "02-vue.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "02-vue.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "02-vue.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
