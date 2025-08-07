import { Alert, Flex, Text, Icon } from "@gravity-ui/uikit";
import { CircleExclamation, TriangleExclamation, CircleInfo } from "@gravity-ui/icons";
import { TimeValidationResult, ValidationIssue } from "shared/timeValidation";

interface ValidationAlertsProps {
  validationResult: TimeValidationResult;
  recordName: string;
  onArrangementClick?: (arrangementId: string) => void;
}

const ValidationAlerts = ({ validationResult, recordName, onArrangementClick }: ValidationAlertsProps) => {
  if (validationResult.issues.length === 0) {
    return null;
  }

  const getIcon = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error':
        return CircleExclamation;
      case 'warning':
        return TriangleExclamation;
      case 'info':
        return CircleInfo;
    }
  };

  // const getTheme = (type: ValidationIssue['type']) => {
  //   switch (type) {
  //     case 'error':
  //       return 'danger' as const;
  //     case 'warning':
  //       return 'warning' as const;
  //     case 'info':
  //       return 'info' as const;
  //   }
  // };

  // Группируем ошибки по типу
  const errorIssues = validationResult.issues.filter(issue => issue.type === 'error');
  const warningIssues = validationResult.issues.filter(issue => issue.type === 'warning');
  const infoIssues = validationResult.issues.filter(issue => issue.type === 'info');

  return (
    <Flex direction="column" gap="2">
      {errorIssues.length > 0 && (
        <Alert
          theme="danger"
          title={`Ошибки в записи "${recordName}"`}
          message={
            <Flex direction="column" gap="1">
              {errorIssues.map((issue, index) => (
                <Flex key={index} gap="2" style={{ alignItems: 'flex-start' }}>
                  <Icon data={getIcon(issue.type)} size={16} />
                  <Flex direction="column" gap="1">
                    <Text variant="body-2">{issue.message}</Text>
                    {issue.affectedIds.length > 0 && onArrangementClick && (
                      <Flex gap="1">
                        {issue.affectedIds.map(id => (
                          <Text
                            key={id}
                            variant="caption-2"
                            color="secondary"
                            style={{ 
                              cursor: 'pointer', 
                              textDecoration: 'underline' 
                            }}
                            onClick={() => onArrangementClick(id)}
                          >
                            Объявление {id.slice(0, 8)}
                          </Text>
                        ))}
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              ))}
            </Flex>
          }
        />
      )}

      {warningIssues.length > 0 && (
        <Alert
          theme="warning"
          title={`Предупреждения в записи "${recordName}"`}
          message={
            <Flex direction="column" gap="1">
              {warningIssues.map((issue, index) => (
                <Flex key={index} gap="2" style={{ alignItems: 'flex-start' }}>
                  <Icon data={getIcon(issue.type)} size={16} />
                  <Flex direction="column" gap="1">
                    <Text variant="body-2">{issue.message}</Text>
                    {issue.affectedIds.length > 0 && onArrangementClick && (
                      <Flex gap="1">
                        {issue.affectedIds.map(id => (
                          <Text
                            key={id}
                            variant="caption-2"
                            color="secondary"
                            style={{ 
                              cursor: 'pointer', 
                              textDecoration: 'underline' 
                            }}
                            onClick={() => onArrangementClick(id)}
                          >
                            Объявление {id.slice(0, 8)}
                          </Text>
                        ))}
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              ))}
            </Flex>
          }
        />
      )}

      {infoIssues.length > 0 && (
        <Alert
          theme="info"
          title="Информация"
          message={
            <Flex direction="column" gap="1">
              {infoIssues.map((issue, index) => (
                <Flex key={index} gap="2" style={{ alignItems: 'flex-start' }}>
                  <Icon data={getIcon(issue.type)} size={16} />
                  <Text variant="body-2">{issue.message}</Text>
                </Flex>
              ))}
            </Flex>
          }
        />
      )}

      {validationResult.overlaps.length > 0 && (
        <Alert
          theme="warning"
          title="Детали пересечений"
          message={
            <Flex direction="column" gap="2">
              {validationResult.overlaps.map((overlap, index) => (
                <Flex key={index} direction="column" gap="1">
                  <Text variant="body-2">
                    Пересечение на {overlap.overlapDuration.toFixed(1)} секунд
                  </Text>
                  <Flex gap="2">
                    <Text variant="caption-2" color="secondary">
                      {overlap.arrangement1.playingTime.start.format('HH:mm:ss')} - {overlap.arrangement1.playingTime.end.format('HH:mm:ss')}
                    </Text>
                    <Text variant="caption-2" color="secondary">vs</Text>
                    <Text variant="caption-2" color="secondary">
                      {overlap.arrangement2.playingTime.start.format('HH:mm:ss')} - {overlap.arrangement2.playingTime.end.format('HH:mm:ss')}
                    </Text>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          }
        />
      )}
    </Flex>
  );
};

export default ValidationAlerts;
