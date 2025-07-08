"use client"

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiEdit
} from 'react-icons/fi';

const ModernStudentList = ({ students = [], onEdit, onDelete, onUpdateStudent, availableUniforms = [], school, allUsers = [] }) => {
  const navigate = useNavigate();
  const [activeSort, setActiveSort] = useState({ key: 'name', direction: 'asc' });
  const [filter, setFilter] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  const getUniformDetails = (student) => {
    if (!student || !school?.uniformRequirements || !student.level) {
      return { totalRequired: 0, totalReceived: 0, percentage: 100, missingCount: 0 };
    }
    const category = student.gender === 'MALE' ? 'BOYS' : 'GIRLS';
    const requirements = school.uniformRequirements[student.level]?.[category] || [];
    if (requirements.length === 0) {
      return { totalRequired: 0, totalReceived: 0, percentage: 100, missingCount: 0 };
    }

    let totalRequired = 0;
    let totalReceived = 0;

    requirements.forEach((req, index) => {
      const key = `${category}-${index}`;
      totalRequired += req.quantityPerStudent || 1;
      totalReceived += student.uniformDistribution?.[key]?.totalReceived || 0;
    });

    const percentage = totalRequired > 0 ? (totalReceived / totalRequired) * 100 : 100;
    const missingCount = totalRequired - totalReceived;

    return { totalRequired, totalReceived, percentage, missingCount };
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const getUserNameById = (userId) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return 'N/A';
    return user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.displayName || user.email || 'Unknown');
  };

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      const key = activeSort.key;
      let valA = a[key];
      let valB = b[key];

      if (key === 'uniformStatus') {
        valA = getUniformDetails(a).percentage;
        valB = getUniformDetails(b).percentage;
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return activeSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return activeSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filterData = (data) => {
    let filtered = data;
    if (filter) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));
    }
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(s => s.level === selectedLevel);
    }
    return filtered;
  };

  const handleSort = (key) => {
    setActiveSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleManageUniforms = (student) => {
    navigate(`/schools/${school.id}/students/${student.id}/manage-uniforms`);
  };

  const handleViewDetails = (student) => {
    navigate(`/schools/${school.id}/students/${student.id}/details`);
  };

  const sortedStudents = sortData(students);
  const filteredStudents = filterData(sortedStudents);

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const levels = ['all', ...Array.from(new Set(students.map(s => s.level)))];

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700">
      {/* Filters and Header */}
      <div className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-700">
        <div className="relative w-full md:w-auto">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 w-full md:w-64 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-slate-400"/>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            {levels.map(level => (
              <option key={level} value={level} className="capitalize">
                {level === 'all' ? 'All Levels' : level}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-900/30">
            <tr>
              {['name', 'level', 'gender'].map(key => (
                <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort(key)}>
                  <div className="flex items-center gap-1">
                    {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                    {activeSort.key === key && (activeSort.direction === 'asc' ? <FiChevronUp/> : <FiChevronDown/>)}
                  </div>
                </th>
              ))}
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('uniformStatus')}>
                <div className="flex items-center gap-1">
                  UNIFORM STATUS {activeSort.key === 'uniformStatus' && (activeSort.direction === 'asc' ? <FiChevronUp/> : <FiChevronDown/>)}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Missing Uniforms</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Updated</th>
              <th scope="col" className="relative px-6 py-3 text-right">
                <span className="sr-only">Actions</span>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {paginatedStudents.map((student) => {
              const { percentage, missingCount } = getUniformDetails(student);
              return (
                <tr
                  key={student.id}
                  className="bg-slate-900/20 hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => handleManageUniforms(student)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-slate-700 rounded-full text-sm font-bold text-slate-200">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-100">{student.name}</div>
                        <div className="text-sm text-slate-400">{student.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-500/10 text-sky-400 capitalize">
                      {student.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">
                    {student.gender.toLowerCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${percentage >= 100 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      <span className="text-sm text-slate-300">{Math.round(percentage)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {missingCount > 0 ? (
                      <div className="flex items-center gap-1.5 text-yellow-400 text-sm">
                        <FiAlertCircle />
                        <span>{missingCount} missing item(s)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-green-400 text-sm">
                        <FiCheckCircle />
                        <span>All uniforms received</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    <div className="text-slate-200">{formatDate(student.updatedAt)}</div>
                    <div className="text-xs">by {getUserNameById(student.updatedBy)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleViewDetails(student); 
                        }} 
                        className="p-2 rounded-md hover:bg-slate-700 transition-colors"
                        title="View Details"
                      >
                        <FiEye className="w-4 h-4 text-green-400" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(student); }} 
                        className="p-2 rounded-md hover:bg-slate-700 transition-colors"
                        title="Edit Student"
                      >
                        <FiEdit className="w-4 h-4 text-sky-400" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(student.id); }} 
                        className="p-2 rounded-md hover:bg-slate-700 transition-colors"
                        title="Delete Student"
                      >
                        <FiTrash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 flex items-center justify-between border-t border-slate-700">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-slate-700 text-slate-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-slate-700 text-slate-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ModernStudentList;