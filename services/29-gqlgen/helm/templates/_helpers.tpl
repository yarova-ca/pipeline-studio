{{/*
Expand the name of the chart.
*/}}
{{- define "29-gqlgen.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "29-gqlgen.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "29-gqlgen.labels" -}}
helm.sh/chart: {{ include "29-gqlgen.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "29-gqlgen.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "29-gqlgen.selectorLabels" -}}
app.kubernetes.io/name: {{ include "29-gqlgen.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "29-gqlgen.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "29-gqlgen.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
