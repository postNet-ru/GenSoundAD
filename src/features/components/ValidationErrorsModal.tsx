import { Alert, Card, Text, Button, Modal, useToaster } from "@gravity-ui/uikit";
import { useState } from "react";
// import { TimeValidationResult, ValidationIssue } from "shared/timeValidation";
import { ValidationIssue } from "shared/timeValidation";
import { useArrangements, useTimeOfRecords } from "app/context/hooks";
import { validateAllRecords, getProjectValidationSummary } from "shared/timeValidation";

export const ValidationErrorsModal = () => {
  const arrangements = useArrangements();
  const timeOfRecords = useTimeOfRecords();
  const [isOpen, setIsOpen] = useState(false);
  const toaster = useToaster();

  const validationResults = validateAllRecords(arrangements, timeOfRecords);
  const summary = getProjectValidationSummary(validationResults);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const formatIssueMessage = (issue: ValidationIssue, recordName: string) => {
    let message = issue.message;
    
    if (issue.affectedIds.length > 0) {
      // Находим объявления по ID для отображения дополнительной информации
      const recordArrangements = arrangements[recordName] || [];
      const affectedArrangements = recordArrangements.filter(arr => 
        issue.affectedIds.includes(arr.id)
      );
      
      if (affectedArrangements.length > 0) {
        const arrangementInfo = affectedArrangements.map(arr => {
          const start = arr.playingTime.start.format('HH:mm:ss');
          const end = arr.playingTime.end.format('HH:mm:ss');
          return `${start} - ${end}`;
        }).join(', ');
        
        message += ` (Время: ${arrangementInfo})`;
      }
    }
    
    return message;
  };

  const getSeverityColor = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'critical': return '#ff4757';
      case 'medium': return '#ffa726';
      case 'low': return '#ffca28';
      default: return '#757575';
    }
  };

  const getTypeIcon = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '';
    }
  };

  if (!summary.hasErrors && !summary.hasWarnings) {
    return null;
  }

  return (
    <>
      <Alert
        theme={summary.hasErrors ? "danger" : "warning"}
        message={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {summary.hasErrors 
                ? `Обнаружено ${summary.criticalIssues} критических ошибок во временных интервалах`
                : `Обнаружено ${summary.totalIssues} предупреждений во временных интервалах`
              }
            </span>
            <Button onClick={openModal} size="s" view="outlined">
              Подробнее
            </Button>
          </div>
        }
      />

      <Modal open={isOpen} onClose={closeModal}>
        <div style={{ padding: '24px' }}>
          <Text variant="header-1" style={{ marginBottom: '16px' }}>
            Ошибки и предупреждения валидации
          </Text>
          
          <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
            {Object.entries(validationResults).map(([recordName, result]) => {
              if (result.issues.length === 0) return null;
              
              return (
                <Card key={recordName} style={{ marginBottom: '16px' }}>
                  <Text variant="subheader-2" style={{ marginBottom: '8px' }}>
                    Запись: {recordName}
                  </Text>
                  
                  {result.issues.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {result.issues.map((issue, index) => (
                        <div key={index}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: '8px',
                            padding: '8px',
                            backgroundColor: issue.type === 'error' ? '#ffebee' : '#fff3e0',
                            borderLeft: `4px solid ${getSeverityColor(issue.severity)}`,
                            borderRadius: '4px'
                          }}>
                            <span style={{ fontSize: '16px', marginTop: '2px' }}>
                              {getTypeIcon(issue.type)}
                            </span>
                            <div style={{ flex: 1 }}>
                              <Text style={{ fontWeight: 500 }}>
                                {formatIssueMessage(issue, recordName)}
                              </Text>
                              <Text variant="caption-2" color="secondary">
                                Серьезность: {issue.severity} | Тип: {issue.type}
                              </Text>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.overlaps.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <Text variant="subheader-3" style={{ marginBottom: '8px' }}>
                        Пересечения объявлений:
                      </Text>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {result.overlaps.map((overlap, index) => (
                          <div key={index}>
                            <div style={{ 
                              padding: '8px',
                              backgroundColor: '#ffecb3',
                              borderLeft: '4px solid #ff9800',
                              borderRadius: '4px'
                            }}>
                              <Text>
                                🔄 Пересечение на {overlap.overlapDuration.toFixed(1)} секунд
                              </Text>
                              <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                                <div>
                                  Объявление 1: {overlap.arrangement1.playingTime.start.format('HH:mm:ss')} - {overlap.arrangement1.playingTime.end.format('HH:mm:ss')}
                                </div>
                                <div>
                                  Объявление 2: {overlap.arrangement2.playingTime.start.format('HH:mm:ss')} - {overlap.arrangement2.playingTime.end.format('HH:mm:ss')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        
          <div style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button onClick={closeModal} view="action">
              Закрыть
            </Button>
            <Button 
              onClick={() => {
                console.log('Detailed validation results:', validationResults);
                toaster.add({
                  name: "console-log",
                  title: "Подробная информация выведена в консоль браузера",
                  theme: "info",
                  autoHiding: 3000,
                });
              }}
              view="outlined"
            >
              Вывести в консоль
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
