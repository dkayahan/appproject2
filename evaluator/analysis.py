#!/usr/bin/env python2
"""
<analysis.py>: A command line tool to analyze prediction results of svm_multiclass_classify

Usage: python analysis.py [options] [source]

Options:
    -p, --predictions-file ...          Predictions file path. Holds path of prediction results file generated by svm_multiclass_classify
    -t, --test-data-file ...            Test data file path. Holds path of test data file that is used only to get real classes of documents
    -c, --class-list-file ...           Class list file path. Holds path of class list file that contains the list of documents classes
    -h, --help                          Show this help

Example:
    analysis.py -p predictionsFile -t testDataFile -c classListFile
"""

__author__ = "Serkan Duman (serkan.duman@gmail.com)"
__version__ = "$Revision: 1.0 $"
__date__ = "$Date: 2017/05/17 22:56:00 $"
__copyright__ = "Copyright (c) 2017 Serkan Duman"
__license__ = "Python"

import sys
import getopt

from PredictionAnalyzer import SvmPredictionAnalyzer as svm_pa

def usage():
    print __doc__

def main(argv):
    predictions_path = None
    test_data_path = None
    class_list_path = None
    try:
        opts, args = getopt.getopt(argv, "hp:t:c:", ["help", "predictions-file=", "test-data-file", "class-list-file"])
    except getopt.GetoptError:
        usage()
        sys.exit(2)
    for opt, arg in opts:
        if opt in ("-h", "--help"):
            usage()
            sys.exit()
        elif opt in ("-p", "--predictions-file"):
            predictions_path = arg
        elif opt in ("-t", "--test-data-file"):
            test_data_path = arg
        elif opt in ("-c", "--class-list-file"):
            class_list_path = arg
        else:
            usage()
            sys.exit()

    if predictions_path is None:
        print "Prediction results file is not specified! Please specify it with '-p' or '--predictions-file'!\n"
        usage()
        sys.exit()

    if test_data_path is None:
        print "Test data file is not specified! Please specify it with '-t' or '--test-data-file'!\n"
        usage()
        sys.exit()

    if class_list_path is None:
        print "Class list file is not specified! Please specify it with '-c' or '--class-list-file'!\n"
        usage()
        sys.exit()

    prediction_analyzer_obj = svm_pa.SvmPredictionAnalyzer(predictions_path, test_data_path, class_list_path)
    print prediction_analyzer_obj.create_confusion_matrix()
    print prediction_analyzer_obj.get_precision_recall_f_measure_results()
    print prediction_analyzer_obj.get_micro_average_results()
    print prediction_analyzer_obj.get_macro_average_results()

if __name__ == "__main__":
    main(sys.argv[1:])