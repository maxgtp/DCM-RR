/**
 * Property-Based Tests for LocalStorageManager
 * Framework: Jest + fast-check
 */

const fc = require('fast-check');
const LocalStorageManager = require('./localstorage-manager.js');

describe('LocalStorageManager - Property-Based Tests', () => {
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  // Feature: reliable-save-system, Property 7: Complete Data Persistence
  // Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6
  describe('Property 7: Complete Data Persistence', () => {
    
    test('for any report with all field types, all fields should be persisted and recoverable', () => {
      fc.assert(
        fc.property(
          // Generator for complete report data
          fc.record({
            // Text fields (Requirements 6.2, 8.1)
            protocol: fc.string({ minLength: 10, maxLength: 20 }),
            citizenName: fc.string({ minLength: 3, maxLength: 100 }),
            cpf: fc.string({ minLength: 11, maxLength: 14 }),
            rg: fc.string({ minLength: 5, maxLength: 20 }),
            phone: fc.string({ minLength: 10, maxLength: 15 }),
            address: fc.string({ minLength: 10, maxLength: 200 }),
            neighborhood: fc.string({ minLength: 3, maxLength: 50 }),
            city: fc.string({ minLength: 3, maxLength: 50 }),
            zipCode: fc.string({ minLength: 8, maxLength: 10 }),
            description: fc.string({ minLength: 10, maxLength: 500 }),
            technicalAnalysis: fc.string({ minLength: 10, maxLength: 500 }),
            recommendations: fc.string({ minLength: 10, maxLength: 500 }),
            finalOpinion: fc.string({ minLength: 10, maxLength: 500 }),
            agentName: fc.string({ minLength: 3, maxLength: 100 }),
            agentId: fc.string({ minLength: 3, maxLength: 50 }),
            agentRole: fc.string({ minLength: 3, maxLength: 50 }),
            
            // Numeric fields (Requirements 6.3, 8.2)
            floors: fc.integer({ min: 1, max: 100 }),
            residents: fc.integer({ min: 0, max: 1000 }),
            buildingAge: fc.integer({ min: 0, max: 200 }),
            builtArea: fc.float({ min: 10, max: 10000 }),
            
            // Selection/checkbox fields (Requirements 6.4, 8.3)
            requestTypes: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
            occurrenceTypes: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
            pathologyTypes: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 0, maxLength: 5 }),
            anomalyLocations: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 0, maxLength: 5 }),
            
            // Date fields (Requirements 6.5, 8.4)
            serviceDate: fc.date().map(d => d.toISOString().split('T')[0]),
            serviceTime: fc.string({ minLength: 5, maxLength: 5 }).filter(s => /^\d{2}:\d{2}$/.test(s) || s === '00:00'),
            
            // Images in Base64 (Requirements 6.6, 8.5)
            photos: fc.array(
              fc.record({
                name: fc.string({ minLength: 5, maxLength: 50 }),
                data: fc.string({ minLength: 100, maxLength: 1000 }).map(s => 'data:image/jpeg;base64,' + s)
              }),
              { minLength: 0, maxLength: 5 }
            ),
            
            // Additional fields
            buildingType: fc.string({ minLength: 3, maxLength: 50 }),
            structureType: fc.string({ minLength: 3, maxLength: 50 }),
            roofType: fc.string({ minLength: 3, maxLength: 50 }),
            occupation: fc.string({ minLength: 3, maxLength: 50 }),
            riskClassification: fc.constantFrom('Baixo', 'Médio', 'Alto'),
            requestOther: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: '' }),
            occurrenceOther: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: '' }),
            pathologyOther: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: '' }),
            anomalyLocationOther: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: '' })
          }),
          (reportData) => {
            // Save the report
            const saveResult = LocalStorageManager.saveReport(reportData);
            
            // Verify save was successful
            expect(saveResult.success).toBe(true);
            expect(saveResult.protocol).toBe(reportData.protocol);
            
            // Retrieve the report
            const retrievedReport = LocalStorageManager.getReport(reportData.protocol);
            
            // Verify report was retrieved
            expect(retrievedReport).not.toBeNull();
            
            // Verify all text fields are preserved (Requirements 6.2, 8.1)
            expect(retrievedReport.protocol).toBe(reportData.protocol);
            expect(retrievedReport.citizenName).toBe(reportData.citizenName);
            expect(retrievedReport.cpf).toBe(reportData.cpf);
            expect(retrievedReport.rg).toBe(reportData.rg);
            expect(retrievedReport.phone).toBe(reportData.phone);
            expect(retrievedReport.address).toBe(reportData.address);
            expect(retrievedReport.neighborhood).toBe(reportData.neighborhood);
            expect(retrievedReport.city).toBe(reportData.city);
            expect(retrievedReport.zipCode).toBe(reportData.zipCode);
            expect(retrievedReport.description).toBe(reportData.description);
            expect(retrievedReport.technicalAnalysis).toBe(reportData.technicalAnalysis);
            expect(retrievedReport.recommendations).toBe(reportData.recommendations);
            expect(retrievedReport.finalOpinion).toBe(reportData.finalOpinion);
            expect(retrievedReport.agentName).toBe(reportData.agentName);
            expect(retrievedReport.agentId).toBe(reportData.agentId);
            expect(retrievedReport.agentRole).toBe(reportData.agentRole);
            
            // Verify all numeric fields are preserved (Requirements 6.3, 8.2)
            expect(retrievedReport.floors).toBe(reportData.floors);
            expect(retrievedReport.residents).toBe(reportData.residents);
            expect(retrievedReport.buildingAge).toBe(reportData.buildingAge);
            expect(retrievedReport.builtArea).toBe(reportData.builtArea);
            
            // Verify all selection/checkbox fields are preserved (Requirements 6.4, 8.3)
            expect(retrievedReport.requestTypes).toEqual(reportData.requestTypes);
            expect(retrievedReport.occurrenceTypes).toEqual(reportData.occurrenceTypes);
            expect(retrievedReport.pathologyTypes).toEqual(reportData.pathologyTypes);
            expect(retrievedReport.anomalyLocations).toEqual(reportData.anomalyLocations);
            
            // Verify all date fields are preserved (Requirements 6.5, 8.4)
            expect(retrievedReport.serviceDate).toBe(reportData.serviceDate);
            expect(retrievedReport.serviceTime).toBe(reportData.serviceTime);
            
            // Verify all images are preserved (Requirements 6.6, 8.5)
            expect(retrievedReport.photos).toEqual(reportData.photos);
            expect(retrievedReport.photos.length).toBe(reportData.photos.length);
            
            // Verify each photo
            reportData.photos.forEach((photo, index) => {
              expect(retrievedReport.photos[index].name).toBe(photo.name);
              expect(retrievedReport.photos[index].data).toBe(photo.data);
            });
            
            // Verify metadata fields were added
            expect(retrievedReport.savedAt).toBeDefined();
            expect(retrievedReport.version).toBe('1.0');
            
            // Clean up
            LocalStorageManager.removeReport(reportData.protocol);
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });
    
    test('for any report, saving and retrieving should be idempotent', () => {
      fc.assert(
        fc.property(
          fc.record({
            protocol: fc.string({ minLength: 10, maxLength: 20 }),
            citizenName: fc.string({ minLength: 3, maxLength: 100 }),
            description: fc.string({ minLength: 10, maxLength: 500 }),
            floors: fc.integer({ min: 1, max: 100 }),
            photos: fc.array(
              fc.record({
                name: fc.string({ minLength: 5, maxLength: 50 }),
                data: fc.string({ minLength: 100, maxLength: 500 }).map(s => 'data:image/jpeg;base64,' + s)
              }),
              { minLength: 0, maxLength: 3 }
            )
          }),
          (reportData) => {
            // Save the report
            LocalStorageManager.saveReport(reportData);
            
            // Retrieve it
            const retrieved1 = LocalStorageManager.getReport(reportData.protocol);
            
            // Save again (overwrite)
            LocalStorageManager.saveReport(reportData);
            
            // Retrieve again
            const retrieved2 = LocalStorageManager.getReport(reportData.protocol);
            
            // Both retrievals should have the same core data
            expect(retrieved1.protocol).toBe(retrieved2.protocol);
            expect(retrieved1.citizenName).toBe(retrieved2.citizenName);
            expect(retrieved1.description).toBe(retrieved2.description);
            expect(retrieved1.floors).toBe(retrieved2.floors);
            expect(retrieved1.photos).toEqual(retrieved2.photos);
            
            // Clean up
            LocalStorageManager.removeReport(reportData.protocol);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

  // Feature: reliable-save-system, Property 11: LocalStorage Quota Handling
  // Validates: Requirements 8.6, 8.7
  describe('Property 11: LocalStorage Quota Handling', () => {
    
    test('for any report, when localStorage is full, system should handle gracefully without losing critical data', () => {
      fc.assert(
        fc.property(
          fc.record({
            protocol: fc.string({ minLength: 10, maxLength: 20 }),
            citizenName: fc.string({ minLength: 3, maxLength: 100 }),
            description: fc.string({ minLength: 10, maxLength: 500 }),
            technicalAnalysis: fc.string({ minLength: 10, maxLength: 500 }),
            recommendations: fc.string({ minLength: 10, maxLength: 500 }),
            address: fc.string({ minLength: 10, maxLength: 200 }),
            agentName: fc.string({ minLength: 3, maxLength: 100 }),
            serviceDate: fc.date().map(d => d.toISOString().split('T')[0]),
            floors: fc.integer({ min: 1, max: 100 }),
            // Large photos to trigger quota issues
            photos: fc.array(
              fc.record({
                name: fc.string({ minLength: 5, maxLength: 50 }),
                data: fc.string({ minLength: 5000, maxLength: 10000 }).map(s => 'data:image/jpeg;base64,' + s)
              }),
              { minLength: 5, maxLength: 10 }
            )
          }),
          (reportData) => {
            // Mock localStorage to simulate quota exceeded
            const originalSetItem = localStorage.setItem;
            let callCount = 0;
            
            localStorage.setItem = function(key, value) {
              callCount++;
              // First call (with images) should fail
              if (callCount === 1) {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                error.code = 22;
                throw error;
              }
              // Subsequent calls (fallback strategies) should succeed
              return originalSetItem.call(this, key, value);
            };
            
            try {
              // Attempt to save report (should trigger quota handling)
              const result = LocalStorageManager.saveReport(reportData);
              
              // Verify save was handled gracefully (Requirements 8.6, 8.7)
              expect(result.success).toBe(true);
              expect(result.protocol).toBe(reportData.protocol);
              
              // Should have a warning about fallback
              expect(result.warning).toBeDefined();
              
              // Retrieve the report
              const retrievedReport = LocalStorageManager.getReport(reportData.protocol);
              
              // Verify critical data is preserved
              expect(retrievedReport).not.toBeNull();
              expect(retrievedReport.protocol).toBe(reportData.protocol);
              expect(retrievedReport.citizenName).toBe(reportData.citizenName);
              expect(retrievedReport.description).toBe(reportData.description);
              expect(retrievedReport.technicalAnalysis).toBe(reportData.technicalAnalysis);
              expect(retrievedReport.recommendations).toBe(reportData.recommendations);
              expect(retrievedReport.address).toBe(reportData.address);
              expect(retrievedReport.agentName).toBe(reportData.agentName);
              expect(retrievedReport.serviceDate).toBe(reportData.serviceDate);
              
              // Verify fallback level is recorded
              expect(retrievedReport.fallbackLevel).toBeDefined();
              expect(['no_images', 'essential_only']).toContain(retrievedReport.fallbackLevel);
              
              // If fallback was 'no_images', photos should be empty
              if (retrievedReport.fallbackLevel === 'no_images') {
                expect(retrievedReport.photos).toEqual([]);
              }
              
              // Clean up
              LocalStorageManager.removeReport(reportData.protocol);
              
            } finally {
              // Restore original setItem
              localStorage.setItem = originalSetItem;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('for any report, when quota is exceeded twice, essential fields should still be saved', () => {
      fc.assert(
        fc.property(
          fc.record({
            protocol: fc.string({ minLength: 10, maxLength: 20 }),
            citizenName: fc.string({ minLength: 3, maxLength: 100 }),
            description: fc.string({ minLength: 10, maxLength: 500 }),
            technicalAnalysis: fc.string({ minLength: 10, maxLength: 500 }),
            recommendations: fc.string({ minLength: 10, maxLength: 500 }),
            address: fc.string({ minLength: 10, maxLength: 200 }),
            agentName: fc.string({ minLength: 3, maxLength: 100 }),
            serviceDate: fc.date().map(d => d.toISOString().split('T')[0]),
            // Many large fields to trigger quota
            floors: fc.integer({ min: 1, max: 100 }),
            residents: fc.integer({ min: 0, max: 1000 }),
            photos: fc.array(
              fc.record({
                name: fc.string({ minLength: 5, maxLength: 50 }),
                data: fc.string({ minLength: 5000, maxLength: 10000 }).map(s => 'data:image/jpeg;base64,' + s)
              }),
              { minLength: 5, maxLength: 10 }
            )
          }),
          (reportData) => {
            // Mock localStorage to simulate quota exceeded on first two attempts
            const originalSetItem = localStorage.setItem;
            let callCount = 0;
            
            localStorage.setItem = function(key, value) {
              callCount++;
              // First two calls should fail (full data, then without images)
              if (callCount <= 2) {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                error.code = 22;
                throw error;
              }
              // Third call (essential only) should succeed
              return originalSetItem.call(this, key, value);
            };
            
            try {
              // Attempt to save report (should fall back to essential fields)
              const result = LocalStorageManager.saveReport(reportData);
              
              // Verify save was handled gracefully
              expect(result.success).toBe(true);
              expect(result.protocol).toBe(reportData.protocol);
              expect(result.warning).toBeDefined();
              
              // Retrieve the report
              const retrievedReport = LocalStorageManager.getReport(reportData.protocol);
              
              // Verify essential fields are preserved
              expect(retrievedReport).not.toBeNull();
              expect(retrievedReport.protocol).toBe(reportData.protocol);
              expect(retrievedReport.citizenName).toBe(reportData.citizenName);
              expect(retrievedReport.description).toBe(reportData.description);
              expect(retrievedReport.technicalAnalysis).toBe(reportData.technicalAnalysis);
              expect(retrievedReport.recommendations).toBe(reportData.recommendations);
              expect(retrievedReport.address).toBe(reportData.address);
              expect(retrievedReport.agentName).toBe(reportData.agentName);
              expect(retrievedReport.serviceDate).toBe(reportData.serviceDate);
              
              // Verify fallback level is 'essential_only'
              expect(retrievedReport.fallbackLevel).toBe('essential_only');
              
              // Clean up
              LocalStorageManager.removeReport(reportData.protocol);
              
            } finally {
              // Restore original setItem
              localStorage.setItem = originalSetItem;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('for any report, hasSpace should accurately predict if save will succeed', () => {
      fc.assert(
        fc.property(
          fc.record({
            protocol: fc.string({ minLength: 10, maxLength: 20 }),
            citizenName: fc.string({ minLength: 3, maxLength: 100 }),
            description: fc.string({ minLength: 10, maxLength: 200 }),
            floors: fc.integer({ min: 1, max: 100 })
          }),
          (reportData) => {
            // Estimate size of the report
            const estimatedSize = LocalStorageManager._estimateSize(reportData);
            
            // Check if there's space
            const hasSpace = LocalStorageManager.hasSpace(estimatedSize);
            
            // If hasSpace says yes, save should succeed without fallback
            if (hasSpace) {
              const result = LocalStorageManager.saveReport(reportData);
              expect(result.success).toBe(true);
              expect(result.warning).toBeUndefined();
              
              // Clean up
              LocalStorageManager.removeReport(reportData.protocol);
            }
            
            // This property just verifies the hasSpace function is reasonable
            // We can't test the negative case easily without filling localStorage
            expect(typeof hasSpace).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
