{{/*
Expand the name of the chart.
*/}}
{{- define "08-single-spa.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "08-single-spa.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "08-single-spa.labels" -}}
helm.sh/chart: {{ include "08-single-spa.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "08-single-spa.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "08-single-spa.selectorLabels" -}}
app.kubernetes.io/name: {{ include "08-single-spa.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "08-single-spa.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "08-single-spa.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
