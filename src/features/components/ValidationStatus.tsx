import { Alert, Button, Flex, Text, Icon, Label } from "@gravity-ui/uikit";
import { CircleExclamation, TriangleExclamation, CircleCheck } from "@gravity-ui/icons";
import { useState } from "react";
import { getProjectValidationSummary, TimeValidationResult } from "shared/timeValidation";

interface ValidationStatusProps {
  validationResults: Record<string, TimeValidationResult>;
  onShowDetails?: () => void;
}

const ValidationStatus = ({ validationResults, onShowDetails }: ValidationStatusProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = getProjectValidationSummary(validationResults);

  if (summary.totalIssues === 0) {
    return (
      <Alert
        theme="success"
        title={
          <Flex gap="2" style={{ alignItems: 'center' }}>
            <Icon data={CircleCheck} size={16} />
            <Text>Все проверки пройдены</Text>
          </Flex>
        }
        message="Проект готов к экспорту"
      />
    );
  }

  const getMainTheme = () => {
    if (summary.hasErrors) return 'danger';
    if (summary.hasWarnings) return 'warning';
    return 'info';
  };

  const getMainIcon = () => {
    if (summary.hasErrors) return CircleExclamation;
    if (summary.hasWarnings) return TriangleExclamation;
    return CircleCheck;
  };

  const getMainTitle = () => {
    if (summary.criticalIssues > 0) {
      return `${summary.criticalIssues} критических ошибок`;
    }
    if (summary.hasErrors) {
      return 'Обнаружены ошибки';
    }
    if (summary.hasWarnings) {
      return 'Есть предупреждения';
    }
    return 'Всё в порядке';
  };

  const recordsWithIssues = Object.entries(validationResults)
    .filter(([, result]) => result.issues.length > 0)
    .length;

  return (
    <Alert
      theme={getMainTheme()}
      title={
        <Flex gap="2" style={{ alignItems: 'center' }}>
          <Icon data={getMainIcon()} size={16} />
          <Text>{getMainTitle()}</Text>
          <Label theme={getMainTheme()} size="s">
            {summary.totalIssues}
          </Label>
        </Flex>
      }
      message={
        <Flex direction="column" gap="2">
          <Text variant="body-2">
            Проблемы найдены в {recordsWithIssues} записи(ях)
          </Text>
          
          {summary.hasErrors && (
            <Text variant="body-2" color="danger">
              ⚠️ Экспорт заблокирован до устранения критических ошибок
            </Text>
          )}

          <Flex gap="2">
            <Button
              size="s"
              view="outlined"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Скрыть детали' : 'Показать детали'}
            </Button>
            
            {onShowDetails && (
              <Button
                size="s"
                view="outlined"
                onClick={onShowDetails}
              >
                Перейти к проблемам
              </Button>
            )}
          </Flex>

          {isExpanded && (
            <Flex direction="column" gap="1">
              {Object.entries(validationResults).map(([recordName, result]) => {
                if (result.issues.length === 0) return null;
                
                const errors = result.issues.filter((i) => i.type === 'error').length;
                const warnings = result.issues.filter((i) => i.type === 'warning').length;

                return (
                  <Flex key={recordName} gap="2" style={{ alignItems: 'center' }}>
                    <Text variant="body-2" style={{ minWidth: '100px' }}>
                      {recordName}:
                    </Text>
                    {errors > 0 && (
                      <Label theme="danger" size="s">
                        {errors} ошибок
                      </Label>
                    )}
                    {warnings > 0 && (
                      <Label theme="warning" size="s">
                        {warnings} предупреждений
                      </Label>
                    )}
                  </Flex>
                );
              })}
            </Flex>
          )}
        </Flex>
      }
    />
  );
};

export default ValidationStatus;
