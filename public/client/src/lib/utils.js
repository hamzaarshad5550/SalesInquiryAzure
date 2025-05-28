"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatCurrency = formatCurrency;
exports.formatPercentage = formatPercentage;
exports.timeAgo = timeAgo;
exports.formatTimeString = formatTimeString;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
function formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value / 100);
}
function timeAgo(date) {
    const now = new Date();
    const past = typeof date === 'string' ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    if (diffInSeconds < 60) {
        return 'just now';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    if (diffInDays < 30) {
        const diffInWeeks = Math.floor(diffInDays / 7);
        return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
    }
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    }
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}
/**
 * Formats a time string to a consistent format (HH:MM AM/PM - HH:MM AM/PM)
 * @param timeString The time string to format
 * @returns Formatted time string
 */
function formatTimeString(timeString) {
    if (!timeString)
        return '';
    // If already in correct format, return as is
    if (/^\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)$/i.test(timeString)) {
        return timeString;
    }
    // If only one time is provided (no range)
    if (!timeString.includes('-')) {
        let time = timeString.trim();
        // Add minutes if only hour is provided
        if (/^\d{1,2}$/.test(time)) {
            time = `${time}:00`;
        }
        // Add AM/PM if not provided
        if (/^\d{1,2}:\d{2}$/.test(time)) {
            const hour = parseInt(time.split(':')[0]);
            time = `${time} ${hour >= 12 ? 'PM' : 'AM'}`;
        }
        return time;
    }
    // Handle time range
    const [start, end] = timeString.split('-').map(t => t.trim());
    // Format start time
    let formattedStart = start;
    if (/^\d{1,2}$/.test(start)) {
        formattedStart = `${start}:00`;
    }
    if (/^\d{1,2}:\d{2}$/.test(formattedStart)) {
        const hour = parseInt(formattedStart.split(':')[0]);
        formattedStart = `${formattedStart} ${hour >= 12 ? 'PM' : 'AM'}`;
    }
    // Format end time
    let formattedEnd = end || '';
    if (/^\d{1,2}$/.test(end)) {
        formattedEnd = `${end}:00`;
    }
    if (/^\d{1,2}:\d{2}$/.test(formattedEnd)) {
        const hour = parseInt(formattedEnd.split(':')[0]);
        formattedEnd = `${formattedEnd} ${hour >= 12 ? 'PM' : 'AM'}`;
    }
    return formattedEnd ? `${formattedStart} - ${formattedEnd}` : formattedStart;
}
