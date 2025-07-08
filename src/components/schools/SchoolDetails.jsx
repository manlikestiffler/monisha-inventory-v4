import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useSchoolStore from '../../stores/schoolStore';
import Button from '../ui/Button';
import StudentModal from './StudentModal';
import Modal from '../ui/Modal';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const UniformCard = ({ uniform, uniformDetails, onRemove, index, level, gender }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">{uniformDetails?.name || 'Unknown Uniform'}</h3>
            <p className="mt-1 text-sm text-gray-500">{uniformDetails?.description || 'No description available'}</p>
          </div>
          <div className="flex items-center space-x-2">
          {uniform.required && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Required
            </span>
          )}
            {onRemove && (
              <button 
                onClick={() => onRemove(level, gender, index)}
                className="text-red-500 hover:text-red-700"
                title="Remove uniform"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">Quantity per student:</span>
          <span className="font-medium text-gray-900">{uniform.quantityPerStudent}</span>
        </div>
      </div>
    </div>
  );
};

const UniformCategory = ({ title, uniforms = [], availableUniforms = [], onAddUniform, onRemoveUniform, level, gender }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <Button variant="outline" size="sm" onClick={() => onAddUniform(level, gender)}>
          Add Uniform
        </Button>
      </div>
      {uniforms.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">No uniforms added for {title}</p>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {uniforms.map((uniform, index) => (
          <UniformCard
            key={index}
            uniform={uniform}
            uniformDetails={availableUniforms.find(u => u.id === uniform.uniformId)}
              onRemove={onRemoveUniform}
              index={index}
              level={level}
              gender={gender}
          />
        ))}
      </div>
      )}
    </div>
  );
};

const UniformLevel = ({ level, requirements = {}, availableUniforms = [], onAddUniform, onRemoveUniform }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-medium text-gray-900">{level} Level</h2>
      </div>
      <div className="p-6 space-y-8">
        <UniformCategory
          title="Boys Uniforms"
          uniforms={requirements[level]?.BOYS}
          availableUniforms={availableUniforms}
          onAddUniform={onAddUniform}
          onRemoveUniform={onRemoveUniform}
          level={level}
          gender="BOYS"
        />
        <UniformCategory
          title="Girls Uniforms"
          uniforms={requirements[level]?.GIRLS}
          availableUniforms={availableUniforms}
          onAddUniform={onAddUniform}
          onRemoveUniform={onRemoveUniform}
          level={level}
          gender="GIRLS"
        />
      </div>
    </div>
  );
};

const UniformSets = ({ uniformRequirements = {}, availableUniforms = [], onAddUniform, onRemoveUniform }) => {
  return (
    <div className="space-y-6">
      <UniformLevel
        level="JUNIOR"
        requirements={uniformRequirements}
        availableUniforms={availableUniforms}
        onAddUniform={onAddUniform}
        onRemoveUniform={onRemoveUniform}
      />
      <UniformLevel
        level="SENIOR"
        requirements={uniformRequirements}
        availableUniforms={availableUniforms}
        onAddUniform={onAddUniform}
        onRemoveUniform={onRemoveUniform}
      />
    </div>
  );
};

const SchoolDetails = () => {
  const { id } = useParams();
  const { getSchoolById, updateSchool, updateUniformRequirements, fetchUniforms, uniforms } = useSchoolStore();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [addingUniform, setAddingUniform] = useState(null);

  // Fetch uniforms from store
  useEffect(() => {
    const loadUniforms = async () => {
      console.log('Fetching uniforms...');
      const fetchedUniforms = await fetchUniforms();
      console.log('Fetched uniforms:', fetchedUniforms);
    };
    loadUniforms();
  }, [fetchUniforms]);

  // Fetch school data
  useEffect(() => {
    const fetchSchool = async () => {
      try {
        setLoading(true);
        const schoolData = await getSchoolById(id);
        if (!schoolData) {
          setError('School not found');
          return;
        }

        // Ensure uniform requirements have the correct structure
        const requirements = schoolData.uniformRequirements || {
          JUNIOR: { Boys: [], Girls: [] },
          SENIOR: { Boys: [], Girls: [] }
        };

        // Normalize the data structure with proper type checking
        const normalizedRequirements = {
          JUNIOR: {
            Boys: Array.isArray(requirements.JUNIOR?.Boys) 
              ? requirements.JUNIOR.Boys.map(item => ({
              uniformId: item.uniformId || '',
              item: item.item || '',
                  quantityPerStudent: Number(item.quantityPerStudent) || 1,
              required: item.required !== false
                }))
              : [],
            Girls: Array.isArray(requirements.JUNIOR?.Girls)
              ? requirements.JUNIOR.Girls.map(item => ({
              uniformId: item.uniformId || '',
              item: item.item || '',
                  quantityPerStudent: Number(item.quantityPerStudent) || 1,
              required: item.required !== false
                }))
              : []
          },
          SENIOR: {
            Boys: Array.isArray(requirements.SENIOR?.Boys)
              ? requirements.SENIOR.Boys.map(item => ({
              uniformId: item.uniformId || '',
              item: item.item || '',
                  quantityPerStudent: Number(item.quantityPerStudent) || 1,
              required: item.required !== false
                }))
              : [],
            Girls: Array.isArray(requirements.SENIOR?.Girls)
              ? requirements.SENIOR.Girls.map(item => ({
              uniformId: item.uniformId || '',
              item: item.item || '',
                  quantityPerStudent: Number(item.quantityPerStudent) || 1,
              required: item.required !== false
                }))
              : []
          }
        };

        console.log('Setting normalized requirements:', normalizedRequirements);

        setSchool({
          ...schoolData,
          uniformRequirements: normalizedRequirements
        });
      } catch (err) {
        console.error('Error fetching school:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
    fetchSchool();
    }
  }, [id, getSchoolById]);

  const handleAddStudent = async (studentData) => {
    try {
      const updatedStudents = [...(school.students || []), { id: Date.now().toString(), ...studentData }];
      const updatedSchool = { ...school, students: updatedStudents };
      await updateSchool(id, updatedSchool);
      setSchool(updatedSchool);
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };

  const handleEditStudent = async (studentData) => {
    try {
      const updatedStudents = school.students.map(student => 
        student.id === studentData.id ? studentData : student
      );
      const updatedSchool = { ...school, students: updatedStudents };
      await updateSchool(id, updatedSchool);
      setSchool(updatedSchool);
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      const updatedStudents = school.students.filter(student => student.id !== studentId);
      const updatedSchool = { ...school, students: updatedStudents };
      await updateSchool(id, updatedSchool);
      setSchool(updatedSchool);
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleAddUniform = (level, gender) => {
    // Set the current level and gender for adding a uniform
    setAddingUniform({ level, gender });
  };

  const handleSelectUniform = async (uniformId, quantity = 1, required = true) => {
    if (!addingUniform || !uniformId) return;
    
    try {
      const { level, gender } = addingUniform;
      
      // Create a copy of the current uniform requirements
      const updatedRequirements = { ...school.uniformRequirements };
      
      // Ensure the arrays exist
      if (!updatedRequirements[level]) {
        updatedRequirements[level] = { BOYS: [], GIRLS: [] };
      }
      if (!updatedRequirements[level][gender]) {
        updatedRequirements[level][gender] = [];
      }
      
      // Add the new uniform
      const uniformDetails = uniforms.find(u => u.id === uniformId);
      updatedRequirements[level][gender].push({
        uniformId,
        item: uniformDetails?.name || '',
        quantityPerStudent: quantity,
        required,
        description: uniformDetails?.description || ''
      });
      
      // Update the uniform requirements
      await updateUniformRequirements(school.id.toString(), updatedRequirements);
      
      // Update local state
      setSchool(prev => ({
        ...prev,
        uniformRequirements: updatedRequirements
      }));
      
      // Reset adding state
      setAddingUniform(null);
    } catch (error) {
      console.error('Error adding uniform:', error);
    }
  };

  const handleRemoveUniform = async (level, gender, index) => {
    try {
      // Create a copy of the current uniform requirements
      const updatedRequirements = { ...school.uniformRequirements };
      
      // Remove the uniform at the specified index
      updatedRequirements[level][gender].splice(index, 1);
      
      // Update the uniform requirements
      await updateUniformRequirements(school.id.toString(), updatedRequirements);
      
      // Update local state
      setSchool(prev => ({
        ...prev,
        uniformRequirements: updatedRequirements
      }));
    } catch (error) {
      console.error('Error removing uniform:', error);
    }
  };

  const handleUpdateUniformRequirements = async (requirements) => {
    try {
      if (!school?.id) {
        console.error('No school ID available');
        return;
      }

      console.log('Updating uniform requirements:', requirements);

      const result = await updateUniformRequirements(school.id.toString(), requirements);
      
      console.log('Update result:', result);

      setSchool(prev => ({
        ...prev,
        uniformRequirements: result
      }));
    } catch (error) {
      console.error('Error updating uniform requirements:', error);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!school) {
    return <div className="p-4">School not found</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
        <div className="space-x-4">
          <Button variant="primary" onClick={() => setShowAddStudentModal(true)}>
            Add Student
          </Button>
        </div>
      </div>

      {/* School Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">School Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Address</p>
            <p className="text-gray-900">{school.address}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact</p>
            <p className="text-gray-900">{school.contact}</p>
          </div>
        </div>
      </div>

      {/* Uniform Requirements */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Uniform Requirements</h2>
        </div>
        <UniformSets 
          uniformRequirements={school.uniformRequirements} 
          availableUniforms={uniforms}
          onAddUniform={handleAddUniform}
          onRemoveUniform={handleRemoveUniform}
        />
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Students</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uniform Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {school.students?.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.level}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.gender}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(student.uniformStatus || {}).map(([key, status]) => (
                        <span
                          key={key}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : status === 'ordered'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="text"
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowAddStudentModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => handleDeleteStudent(student.id)}
                      className="ml-4 text-red-600 hover:text-red-900"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <StudentModal
        isOpen={showAddStudentModal}
        onClose={() => {
          setShowAddStudentModal(false);
          setSelectedStudent(null);
        }}
        school={school}
        initialData={selectedStudent}
        onSave={selectedStudent ? handleEditStudent : handleAddStudent}
      />

      {/* Uniform Selection Modal */}
      {addingUniform && (
        <Modal
          isOpen={!!addingUniform}
          onClose={() => setAddingUniform(null)}
          title={`Add ${addingUniform.gender} Uniform for ${addingUniform.level} Level`}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {uniforms
                .filter(uniform => {
                  const uniformLevel = uniform.level?.toUpperCase() || '';
                  const uniformGender = uniform.gender?.toUpperCase() || '';
                  const targetLevel = addingUniform.level?.toUpperCase() || '';
                  const targetGender = addingUniform.gender?.toUpperCase() || '';
                  
                  return (uniformLevel === targetLevel || uniformLevel === 'ALL') && 
                         (uniformGender === targetGender || uniformGender === 'UNISEX');
                })
                .map(uniform => (
                  <div 
                    key={uniform.id} 
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-blue-500 cursor-pointer"
                    onClick={() => handleSelectUniform(uniform.id)}
                  >
                    <h3 className="text-lg font-medium text-gray-900">{uniform.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{uniform.description}</p>
                  </div>
                ))}
              
              {uniforms.filter(uniform => {
                const uniformLevel = uniform.level?.toUpperCase() || '';
                const uniformGender = uniform.gender?.toUpperCase() || '';
                const targetLevel = addingUniform.level?.toUpperCase() || '';
                const targetGender = addingUniform.gender?.toUpperCase() || '';
                
                return (uniformLevel === targetLevel || uniformLevel === 'ALL') && 
                       (uniformGender === targetGender || uniformGender === 'UNISEX');
              }).length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500">No matching uniforms found. Please add uniforms in the inventory first.</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAddingUniform(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SchoolDetails; 