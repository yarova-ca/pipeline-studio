{{/*
Expand the name of the chart.
*/}}
{{- define "17-quarkus.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "17-quarkus.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "17-quarkus.labels" -}}
helm.sh/chart: {{ include "17-quarkus.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "17-quarkus.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "17-quarkus.selectorLabels" -}}
app.kubernetes.io/name: {{ include "17-quarkus.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "17-quarkus.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "17-quarkus.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
