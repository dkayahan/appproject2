import sys
import io
import pandas as pd
import json

class BayesianPredictionAnalyzer(object):
    def __init__(self, prediction_result_file):
        self.__actual_classes = []
        self.__predicted_classes = []
        self.__class_set = self.__get_class_set()  # starts from index 1
        self.__construct_actual_predicted_lists(prediction_result_file)
        self.__actual_predicted_tuples = zip(self.__actual_classes, self.__predicted_classes)
        self.__tp_fp_fn_metrics = {}
        self.__p_r_f_measure_obj = {}

    def __get_class_set(self):
        class_list = set()
        for a_class in self.__actual_classes:
            class_list.add(a_class)
        return class_list

    def __construct_actual_predicted_lists(self, prediction_file):
        try:
            with io.open(prediction_file) as data_file:
                data = json.load(data_file)
            self.__actual_classes = data["actualClass"]
            self.__predicted_classes = data["predictedClass"]
        except IOError:
            print "Prediction results file '{}' is not found!".format(prediction_file)
            sys.exit(2)

    def __generate_tp_fp_fn_metrics(self):
        metrics = {}
        for a_class in self.__class_set:
            metrics[a_class] = {}
            metrics[a_class]["tp"] = 0
            metrics[a_class]["fp"] = 0
            metrics[a_class]["fn"] = 0

        for actual, predicted in self.__actual_predicted_tuples:
            if actual == predicted:
                metrics[actual]["tp"] += 1
            else:
                metrics[actual]["fn"] += 1
                metrics[predicted]["fp"] += 1
        return metrics

    def __generate_precision_recall_f_measure_results(self):
        if self.__tp_fp_fn_metrics == {}:
            self.__tp_fp_fn_metrics = self.__generate_tp_fp_fn_metrics()
        p_r_f_results = {}
        for a_class in self.__class_set:
            p_r_f_results[a_class] = {}
            p_r_f_results[a_class]["precision"] = 0.0
            p_r_f_results[a_class]["recall"] = 0.0
            p_r_f_results[a_class]["f-measure"] = 0.0

        for class_key in p_r_f_results.keys():
            tp = self.__tp_fp_fn_metrics[class_key]["tp"]
            fp = self.__tp_fp_fn_metrics[class_key]["fp"]
            fn = self.__tp_fp_fn_metrics[class_key]["fn"]
            precision = 0.0
            recall = 0.0
            f_measure = 0.0
            if tp+fp != 0:
                precision = tp/float(tp+fp)
            if tp+fn != 0:
                recall = tp/float(tp+fn)
            if precision+recall != 0:
                f_measure = 2*precision*recall/(precision+recall)
            p_r_f_results[class_key]["precision"] = precision
            p_r_f_results[class_key]["recall"] = recall
            p_r_f_results[class_key]["f-measure"] = f_measure
        return p_r_f_results

    def create_confusion_matrix(self):
        y_actual = pd.Series(self.__actual_classes, name='Actual')
        y_predicted = pd.Series(self.__predicted_classes, name='Predicted')
        df_confusion = pd.crosstab(y_actual, y_predicted, margins=True)
        return df_confusion

    def get_precision_recall_f_measure_results(self):
        if self.__p_r_f_measure_obj == {}:
            self.__p_r_f_measure_obj = self.__generate_precision_recall_f_measure_results()
        str_val = "\n"
        for class_obj in self.__p_r_f_measure_obj.keys():
            str_val += "For {a_class}:\n".format(a_class=class_obj)
            str_val += "\tPrecision: {precision}\n".format(precision=self.__p_r_f_measure_obj[class_obj]["precision"])
            str_val += "\tRecall: {recall}\n".format(recall=self.__p_r_f_measure_obj[class_obj]["recall"])
            str_val += "\tF-Measure: {f_measure}\n".format(f_measure=self.__p_r_f_measure_obj[class_obj]["f-measure"])
            str_val += "\n"
        return str_val

    def get_micro_average_results(self):
        if self.__tp_fp_fn_metrics == {}:
            self.__tp_fp_fn_metrics = self.__generate_tp_fp_fn_metrics()
        tot_tp = 0
        tot_fp = 0
        tot_fn = 0
        for a_class in self.__tp_fp_fn_metrics.keys():
            tot_tp += self.__tp_fp_fn_metrics[a_class]["tp"]
            tot_fp += self.__tp_fp_fn_metrics[a_class]["fp"]
            tot_fn += self.__tp_fp_fn_metrics[a_class]["fn"]

        micro_precision = 0.0
        micro_recall = 0.0
        micro_f_measure = 0.0
        if tot_tp + tot_fp != 0:
            micro_precision = tot_tp / float(tot_tp + tot_fp)
        if tot_tp + tot_fn != 0:
            micro_recall = tot_tp / float(tot_tp + tot_fn)
        if micro_precision + micro_recall != 0:
            micro_f_measure = 2*micro_precision*micro_recall/(micro_precision+micro_recall)

        str_val = "Micro-Average Results:\n"
        str_val += "\tPrecision: {precision}\n".format(precision=micro_precision)
        str_val += "\tRecall: {recall}\n".format(recall=micro_recall)
        str_val += "\tF-Measure: {f_measure}\n".format(f_measure=micro_f_measure)
        return str_val

    def get_macro_average_results(self):
        if self.__p_r_f_measure_obj == {}:
            self.__p_r_f_measure_obj = self.__generate_precision_recall_f_measure_results()
        class_count = len(self.__p_r_f_measure_obj.keys())
        tot_precision = 0.0
        tot_recall = 0.0
        tot_f_measure = 0.0
        for a_class in self.__p_r_f_measure_obj.keys():
            tot_precision += self.__p_r_f_measure_obj[a_class]["precision"]
            tot_recall += self.__p_r_f_measure_obj[a_class]["recall"]
            tot_f_measure += self.__p_r_f_measure_obj[a_class]["f-measure"]

        macro_precision = tot_precision/class_count
        macro_recall = tot_recall/class_count
        macro_f_measure = tot_f_measure/class_count

        str_val = "Macro-Average Results:\n"
        str_val += "\tPrecision: {precision}\n".format(precision=macro_precision)
        str_val += "\tRecall: {recall}\n".format(recall=macro_recall)
        str_val += "\tF-Measure: {f_measure}\n".format(f_measure=macro_f_measure)
        return str_val