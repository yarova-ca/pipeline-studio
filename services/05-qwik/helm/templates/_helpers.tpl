{{/*
Expand the name of the chart.
*/}}
{{- define "05-qwik.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "05-qwik.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "05-qwik.labels" -}}
helm.sh/chart: {{ include "05-qwik.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "05-qwik.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "05-qwik.selectorLabels" -}}
app.kubernetes.io/name: {{ include "05-qwik.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "05-qwik.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "05-qwik.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
